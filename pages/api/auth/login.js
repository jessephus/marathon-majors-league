/**
 * User Login API
 * 
 * POST /api/auth/login - Login with email and authentication method
 * 
 * Supports multiple authentication methods:
 * - TOTP (Google Authenticator)
 * - SMS OTP
 * - Email OTP  
 * - Magic Link (handled separately via /api/auth/magic-link)
 */

import { getUserByEmail, recordUserLogin, createSession } from '../db.js';
import { 
  isValidEmail, 
  generateSessionToken, 
  verifyTOTPCode,
  decryptTOTPSecret,
  verifyBackupCode,
  AuthErrors 
} from '../lib/auth-utils.js';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    return await handleLogin(req, res);
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Handle user login
 */
async function handleLogin(req, res) {
  const { email, method, code, backupCode } = req.body;
  
  // Validate required fields
  if (!email) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'email is required'
    });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: AuthErrors.INVALID_EMAIL_FORMAT });
  }
  
  try {
    // Find user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      // Generic error for security (don't reveal if user exists)
      return res.status(401).json({ error: AuthErrors.INVALID_CREDENTIALS });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: AuthErrors.ACCOUNT_DISABLED });
    }
    
    // Determine available authentication methods for this user
    const availableMethods = [];
    if (user.totp_enabled && user.totp_secret) {
      availableMethods.push('totp');
    }
    if (user.phone_number && user.phone_verified) {
      availableMethods.push('sms');
    }
    if (user.email && user.email_verified) {
      availableMethods.push('email');
      availableMethods.push('magic_link');
    }
    
    // If no method specified, return available methods
    if (!method && !code && !backupCode) {
      return res.status(200).json({
        message: 'User found. Please provide authentication method.',
        userId: user.id,
        email: user.email,
        availableMethods,
        requiresMFA: user.totp_enabled
      });
    }
    
    // Handle backup code authentication
    if (backupCode) {
      return await handleBackupCodeLogin(user, backupCode, res);
    }
    
    // Validate authentication code based on method
    let isValid = false;
    
    if (method === 'totp') {
      if (!user.totp_enabled || !user.totp_secret) {
        return res.status(400).json({ error: AuthErrors.TOTP_NOT_SETUP });
      }
      
      if (!code) {
        return res.status(400).json({ 
          error: AuthErrors.MISSING_REQUIRED_FIELD,
          message: 'code is required for TOTP authentication'
        });
      }
      
      // Verify TOTP code
      const secret = decryptTOTPSecret(user.totp_secret);
      isValid = verifyTOTPCode(code, secret);
      
      if (!isValid) {
        return res.status(401).json({ 
          error: AuthErrors.INVALID_TOTP,
          message: 'Invalid TOTP code. You can use a backup code if you lost access to your authenticator app.'
        });
      }
    } else if (method === 'sms' || method === 'email') {
      if (!code) {
        return res.status(400).json({ 
          error: AuthErrors.MISSING_REQUIRED_FIELD,
          message: `code is required for ${method} authentication`
        });
      }
      
      // Verify OTP code from database
      const { verifyOTP } = await import('../../db.js');
      const otpResult = await verifyOTP(user.id, code, method);
      
      if (!otpResult || !otpResult.valid) {
        return res.status(401).json({ error: AuthErrors.INVALID_OTP });
      }
      
      isValid = true;
    } else if (method === 'magic_link') {
      // Magic links are handled by /api/auth/magic-link endpoint
      return res.status(400).json({ 
        error: 'Use /api/auth/magic-link endpoint for magic link authentication' 
      });
    } else {
      return res.status(400).json({ 
        error: 'Invalid method. Use: totp, sms, email, or magic_link' 
      });
    }
    
    if (!isValid) {
      return res.status(401).json({ error: AuthErrors.INVALID_CREDENTIALS });
    }
    
    // Create session
    const sessionToken = generateSessionToken();
    await createSession(user.id, sessionToken);
    
    // Record login
    await recordUserLogin(user.id);
    
    // Return session token and user info
    return res.status(200).json({
      message: 'Login successful',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        totpEnabled: user.totp_enabled,
        isAdmin: user.is_admin,
        isStaff: user.is_staff
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Handle backup code login
 */
async function handleBackupCodeLogin(user, backupCode, res) {
  if (!user.totp_enabled) {
    return res.status(400).json({ 
      error: 'Backup codes are only available for accounts with TOTP enabled' 
    });
  }
  
  try {
    // Get unused backup codes for user
    const backupCodes = await sql`
      SELECT id, code_hash
      FROM totp_backup_codes
      WHERE user_id = ${user.id}
      AND used = false
    `;
    
    if (backupCodes.length === 0) {
      return res.status(400).json({ 
        error: 'No backup codes available. Please use another authentication method or contact support.' 
      });
    }
    
    // Try to verify backup code against all unused codes
    let matchedCode = null;
    for (const bc of backupCodes) {
      const isValid = await verifyBackupCode(backupCode, bc.code_hash);
      if (isValid) {
        matchedCode = bc;
        break;
      }
    }
    
    if (!matchedCode) {
      return res.status(401).json({ error: AuthErrors.INVALID_BACKUP_CODE });
    }
    
    // Mark backup code as used
    await sql`
      UPDATE totp_backup_codes
      SET used = true, used_at = NOW()
      WHERE id = ${matchedCode.id}
    `;
    
    // Create session
    const sessionToken = generateSessionToken();
    await createSession(user.id, sessionToken);
    
    // Record login
    await recordUserLogin(user.id);
    
    // Count remaining backup codes
    const remainingCodes = await sql`
      SELECT COUNT(*) as count
      FROM totp_backup_codes
      WHERE user_id = ${user.id}
      AND used = false
    `;
    
    const remaining = parseInt(remainingCodes[0]?.count || 0);
    
    return res.status(200).json({
      message: 'Login successful with backup code',
      sessionToken,
      warning: `You have ${remaining} backup codes remaining. Consider regenerating them soon.`,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        totpEnabled: user.totp_enabled,
        isAdmin: user.is_admin,
        isStaff: user.is_staff
      }
    });
  } catch (error) {
    console.error('Backup code login error:', error);
    return res.status(500).json({ error: 'Backup code verification failed' });
  }
}

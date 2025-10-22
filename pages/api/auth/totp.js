/**
 * TOTP Setup API
 * 
 * POST /api/auth/totp/setup - Initialize TOTP setup for a user
 * POST /api/auth/totp/verify-setup - Verify and enable TOTP
 * POST /api/auth/totp/verify - Verify a TOTP code during login
 */

import { getUserById, updateUser } from '../../db.js';
import { 
  generateTOTPSecret, 
  generateTOTPQRCode, 
  verifyTOTPCode,
  encryptTOTPSecret,
  decryptTOTPSecret,
  generateBackupCodes,
  AuthErrors 
} from '../../lib/auth-utils.js';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse action from query parameter or body
  const action = req.query.action || req.body?.action;
  
  try {
    if (req.method === 'POST') {
      if (action === 'setup') {
        return await handleSetup(req, res);
      } else if (action === 'verify-setup') {
        return await handleVerifySetup(req, res);
      } else if (action === 'verify') {
        return await handleVerify(req, res);
      } else if (action === 'disable') {
        return await handleDisable(req, res);
      } else {
        return res.status(400).json({ 
          error: 'Invalid action. Use: setup, verify-setup, verify, or disable' 
        });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('TOTP API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Initialize TOTP setup
 * Generates a new TOTP secret and QR code for the user
 */
async function handleSetup(req, res) {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: AuthErrors.MISSING_REQUIRED_FIELD });
  }
  
  try {
    // Get user
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: AuthErrors.ACCOUNT_DISABLED });
    }
    
    if (user.totp_enabled) {
      return res.status(400).json({ error: AuthErrors.TOTP_ALREADY_SETUP });
    }
    
    // Generate new TOTP secret
    const secret = generateTOTPSecret();
    
    // Generate QR code
    const qrCodeDataUrl = await generateTOTPQRCode(user.email, secret);
    
    // Encrypt secret for storage
    const encryptedSecret = encryptTOTPSecret(secret);
    
    // Store encrypted secret temporarily (not yet enabled)
    await updateUser(userId, {
      totp_secret: encryptedSecret,
      totp_enabled: false
    });
    
    return res.status(200).json({
      message: 'TOTP setup initiated. Scan QR code with authenticator app.',
      qrCode: qrCodeDataUrl,
      secret, // Return plain secret for manual entry
      email: user.email
    });
  } catch (error) {
    console.error('TOTP setup error:', error);
    return res.status(500).json({ error: 'Failed to initiate TOTP setup' });
  }
}

/**
 * Verify TOTP setup and enable it
 * User must enter a valid code from their authenticator app
 */
async function handleVerifySetup(req, res) {
  const { userId, code } = req.body;
  
  if (!userId || !code) {
    return res.status(400).json({ error: AuthErrors.MISSING_REQUIRED_FIELD });
  }
  
  try {
    // Get user
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.totp_secret) {
      return res.status(400).json({ error: 'TOTP not initialized. Call setup first.' });
    }
    
    if (user.totp_enabled) {
      return res.status(400).json({ error: AuthErrors.TOTP_ALREADY_SETUP });
    }
    
    // Decrypt secret
    const secret = decryptTOTPSecret(user.totp_secret);
    
    // Verify code
    const isValid = verifyTOTPCode(code, secret);
    
    if (!isValid) {
      return res.status(400).json({ error: AuthErrors.INVALID_TOTP });
    }
    
    // Generate backup codes
    const backupCodesData = await generateBackupCodes(10);
    
    // Store backup codes in database
    const backupCodeValues = backupCodesData.map(bc => 
      `(${userId}, '${bc.hash}', false)`
    ).join(', ');
    
    await sql.unsafe(`
      INSERT INTO totp_backup_codes (user_id, code_hash, used)
      VALUES ${backupCodeValues}
    `);
    
    // Enable TOTP
    await updateUser(userId, {
      totp_enabled: true,
      totp_verified_at: new Date()
    });
    
    // Return backup codes (only shown once!)
    const backupCodes = backupCodesData.map(bc => bc.code);
    
    return res.status(200).json({
      message: 'TOTP successfully enabled',
      backupCodes,
      warning: 'Save these backup codes in a secure location. They will not be shown again.'
    });
  } catch (error) {
    console.error('TOTP verify setup error:', error);
    return res.status(500).json({ error: 'Failed to verify TOTP setup' });
  }
}

/**
 * Verify TOTP code during login
 */
async function handleVerify(req, res) {
  const { userId, code } = req.body;
  
  if (!userId || !code) {
    return res.status(400).json({ error: AuthErrors.MISSING_REQUIRED_FIELD });
  }
  
  try {
    // Get user
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.totp_enabled || !user.totp_secret) {
      return res.status(400).json({ error: AuthErrors.TOTP_NOT_SETUP });
    }
    
    // Decrypt secret
    const secret = decryptTOTPSecret(user.totp_secret);
    
    // Verify code
    const isValid = verifyTOTPCode(code, secret);
    
    if (!isValid) {
      return res.status(400).json({ 
        error: AuthErrors.INVALID_TOTP,
        message: 'Invalid TOTP code. Please try again or use a backup code.'
      });
    }
    
    return res.status(200).json({
      message: 'TOTP code verified successfully',
      valid: true
    });
  } catch (error) {
    console.error('TOTP verify error:', error);
    return res.status(500).json({ error: 'Failed to verify TOTP code' });
  }
}

/**
 * Disable TOTP for a user
 * Requires authentication and possibly additional verification
 */
async function handleDisable(req, res) {
  const { userId, code } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: AuthErrors.MISSING_REQUIRED_FIELD });
  }
  
  try {
    // Get user
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.totp_enabled) {
      return res.status(400).json({ error: 'TOTP is not enabled for this account' });
    }
    
    // Verify one last TOTP code before disabling
    if (code) {
      const secret = decryptTOTPSecret(user.totp_secret);
      const isValid = verifyTOTPCode(code, secret);
      
      if (!isValid) {
        return res.status(400).json({ error: AuthErrors.INVALID_TOTP });
      }
    }
    
    // Disable TOTP
    await updateUser(userId, {
      totp_enabled: false,
      totp_secret: null,
      totp_verified_at: null
    });
    
    // Delete backup codes
    await sql`
      DELETE FROM totp_backup_codes
      WHERE user_id = ${userId}
    `;
    
    return res.status(200).json({
      message: 'TOTP successfully disabled'
    });
  } catch (error) {
    console.error('TOTP disable error:', error);
    return res.status(500).json({ error: 'Failed to disable TOTP' });
  }
}

/**
 * Magic Link API
 * 
 * POST /api/auth/magic-link?action=send - Generate and send magic link
 * GET /api/auth/magic-link?action=verify - Verify magic link token
 */

import { getUserByEmail, createMagicLink, verifyMagicLink as verifyMagicLinkDB, createSession } from '../db.js';
import { generateMagicLinkToken, generateSessionToken, isValidEmail, AuthErrors } from '../lib/auth-utils.js';
import { sendEmail, generateMagicLinkEmail } from '../lib/email.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const action = req.query.action || req.body?.action;
  
  try {
    if (req.method === 'POST' && action === 'send') {
      return await handleSendMagicLink(req, res);
    } else if (req.method === 'GET' && action === 'verify') {
      return await handleVerifyMagicLink(req, res);
    } else if (req.method === 'POST' && action === 'verify') {
      return await handleVerifyMagicLink(req, res);
    } else {
      return res.status(400).json({ 
        error: 'Invalid action. Use: send (POST) or verify (GET/POST)' 
      });
    }
  } catch (error) {
    console.error('Magic Link API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Send magic link via email
 */
async function handleSendMagicLink(req, res) {
  const { email, purpose = 'login' } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'email is required'
    });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: AuthErrors.INVALID_EMAIL_FORMAT });
  }
  
  const validPurposes = ['login', 'verify_email', 'reset_totp', 'invite'];
  if (!validPurposes.includes(purpose)) {
    return res.status(400).json({ 
      error: `Invalid purpose. Use: ${validPurposes.join(', ')}` 
    });
  }
  
  try {
    // Find user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: 'If this account exists, a magic link has been sent.',
        success: true
      });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: AuthErrors.ACCOUNT_DISABLED });
    }
    
    // Generate secure token
    const token = generateMagicLinkToken();
    
    // Store token in database
    // Login links expire in 15 minutes, invite links in 7 days
    const expiryMinutes = purpose === 'invite' ? 7 * 24 * 60 : 15;
    
    await createMagicLink(user.id, token, purpose, expiryMinutes);
    
    // Generate email
    const emailTemplate = generateMagicLinkEmail(email, token, purpose);
    
    // Send email
    const sendResult = await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html
    });
    
    if (!sendResult.success) {
      console.error('Magic link email send failed:', sendResult.error);
      return res.status(500).json({ 
        error: 'Failed to send magic link',
        details: process.env.NODE_ENV === 'development' ? sendResult.error : undefined
      });
    }
    
    return res.status(200).json({
      message: 'Magic link sent successfully',
      success: true,
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { token })
    });
  } catch (error) {
    console.error('Send magic link error:', error);
    return res.status(500).json({ error: 'Failed to send magic link' });
  }
}

/**
 * Verify magic link token and create session
 */
async function handleVerifyMagicLink(req, res) {
  const token = req.query.token || req.body?.token;
  
  if (!token) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'token is required'
    });
  }
  
  try {
    // Verify token using database function
    const result = await verifyMagicLinkDB(token);
    
    if (!result || !result.valid) {
      return res.status(400).json({ 
        error: AuthErrors.INVALID_TOKEN,
        message: 'Invalid or expired magic link'
      });
    }
    
    const { user_id, purpose } = result;
    
    // For login purpose, create a session
    let sessionToken = null;
    if (purpose === 'login') {
      sessionToken = generateSessionToken();
      await createSession(user_id, sessionToken);
    }
    
    // For verify_email purpose, mark email as verified
    if (purpose === 'verify_email') {
      const { updateUser } = await import('../../db.js');
      await updateUser(user_id, {
        email_verified: true,
        email_verified_at: new Date()
      });
    }
    
    return res.status(200).json({
      message: 'Magic link verified successfully',
      valid: true,
      userId: user_id,
      purpose,
      ...(sessionToken && { sessionToken })
    });
  } catch (error) {
    console.error('Verify magic link error:', error);
    return res.status(500).json({ error: 'Failed to verify magic link' });
  }
}

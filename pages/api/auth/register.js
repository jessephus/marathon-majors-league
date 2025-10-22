/**
 * User Registration API
 * 
 * POST /api/auth/register - Register a new user account
 */

import { getUserByEmail, createUser, createMagicLink } from '../../db.js';
import { isValidEmail, isValidPhone, formatPhoneE164, generateMagicLinkToken, AuthErrors } from '../../lib/auth-utils.js';
import { sendEmail, generateMagicLinkEmail, generateWelcomeEmail } from '../../lib/email.js';
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
    return await handleRegister(req, res);
  } catch (error) {
    console.error('Registration API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Register a new user
 */
async function handleRegister(req, res) {
  const { email, phoneNumber, displayName, inviteCode } = req.body;
  
  // Validate required fields
  if (!email) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'email is required'
    });
  }
  
  if (!inviteCode) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'inviteCode is required (preview phase)'
    });
  }
  
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: AuthErrors.INVALID_EMAIL_FORMAT });
  }
  
  // Validate phone format if provided
  let formattedPhone = null;
  if (phoneNumber) {
    if (!isValidPhone(phoneNumber)) {
      try {
        formattedPhone = formatPhoneE164(phoneNumber);
      } catch (error) {
        return res.status(400).json({ error: AuthErrors.INVALID_PHONE_FORMAT });
      }
    } else {
      formattedPhone = phoneNumber;
    }
  }
  
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: AuthErrors.USER_ALREADY_EXISTS });
    }
    
    // Verify invite code
    const inviteCodeResult = await sql`
      SELECT id, code_type, max_uses, current_uses, expires_at, is_active
      FROM invite_codes
      WHERE code = ${inviteCode}
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;
    
    if (inviteCodeResult.length === 0) {
      return res.status(400).json({ error: AuthErrors.INVITE_CODE_INVALID });
    }
    
    const invite = inviteCodeResult[0];
    
    // Check if invite code has remaining uses
    if (invite.max_uses && invite.current_uses >= invite.max_uses) {
      return res.status(400).json({ error: AuthErrors.INVITE_CODE_USED });
    }
    
    // Create user account
    const userData = {
      email,
      phone_number: formattedPhone,
      display_name: displayName || email.split('@')[0],
      is_active: true,
      email_verified: false,
      phone_verified: false
    };
    
    const user = await createUser(userData);
    
    // Record invite code usage
    await sql`
      INSERT INTO invite_code_usage (invite_code_id, user_id)
      VALUES (${invite.id}, ${user.id})
    `;
    
    // Update invite code usage count
    await sql`
      UPDATE invite_codes
      SET current_uses = current_uses + 1
      WHERE id = ${invite.id}
    `;
    
    // Generate email verification magic link
    const verificationToken = generateMagicLinkToken();
    await createMagicLink(user.id, verificationToken, 'verify_email', 7 * 24 * 60); // 7 days
    
    // Send verification email
    const verificationEmail = generateMagicLinkEmail(email, verificationToken, 'verify_email');
    const verificationResult = await sendEmail({
      to: email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html
    });
    
    if (!verificationResult.success) {
      console.error('Verification email send failed:', verificationResult.error);
      // Continue anyway - user can request new verification email later
    }
    
    // Send welcome email
    const welcomeEmail = generateWelcomeEmail(email, userData.display_name);
    const welcomeResult = await sendEmail({
      to: email,
      subject: welcomeEmail.subject,
      text: welcomeEmail.text,
      html: welcomeEmail.html
    });
    
    if (!welcomeResult.success) {
      console.error('Welcome email send failed:', welcomeResult.error);
      // Non-critical, continue
    }
    
    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified
      },
      nextSteps: [
        'Check your email for verification link',
        'Set up TOTP authentication (recommended)',
        'Complete your profile'
      ]
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.message?.includes('duplicate key')) {
      if (error.message.includes('email')) {
        return res.status(409).json({ error: AuthErrors.USER_ALREADY_EXISTS });
      }
      if (error.message.includes('phone')) {
        return res.status(409).json({ error: 'Phone number already in use' });
      }
    }
    
    return res.status(500).json({ error: 'Failed to create account' });
  }
}

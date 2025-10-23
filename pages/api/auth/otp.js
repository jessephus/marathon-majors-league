/**
 * OTP (One-Time Password) API
 * 
 * POST /api/auth/otp?action=send - Send OTP via SMS or email
 * POST /api/auth/otp?action=verify - Verify an OTP code
 */

import { getUserById, getUserByEmail, getUserByPhone, createOTP, verifyOTP as verifyOTPDB } from '../db.js';
import { generateOTPCode, isValidEmail, isValidPhone, formatPhoneE164, AuthErrors } from '../lib/auth-utils.js';
import { sendEmail, generateOTPEmail } from '../lib/email.js';
import { sendSMS, generateOTPSMS, generateLoginSMS } from '../lib/sms.js';

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
  
  const action = req.query.action || req.body?.action;
  
  try {
    if (action === 'send') {
      return await handleSendOTP(req, res);
    } else if (action === 'verify') {
      return await handleVerifyOTP(req, res);
    } else {
      return res.status(400).json({ 
        error: 'Invalid action. Use: send or verify' 
      });
    }
  } catch (error) {
    console.error('OTP API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Send OTP via SMS or Email
 */
async function handleSendOTP(req, res) {
  const { identifier, method, purpose = 'login' } = req.body;
  
  // identifier can be email, phone, or userId
  // method is 'sms' or 'email'
  
  if (!identifier || !method) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'identifier and method are required'
    });
  }
  
  if (!['sms', 'email'].includes(method)) {
    return res.status(400).json({ 
      error: 'Invalid method. Use: sms or email' 
    });
  }
  
  try {
    let user;
    
    // Find user by identifier
    if (typeof identifier === 'number') {
      // UserId
      user = await getUserById(identifier);
    } else if (isValidEmail(identifier)) {
      user = await getUserByEmail(identifier);
    } else if (isValidPhone(identifier)) {
      const formattedPhone = formatPhoneE164(identifier);
      user = await getUserByPhone(formattedPhone);
    } else {
      return res.status(400).json({ 
        error: 'Invalid identifier. Provide email, phone, or userId' 
      });
    }
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: 'If this account exists, an OTP has been sent.',
        success: true
      });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: AuthErrors.ACCOUNT_DISABLED });
    }
    
    // Validate user has the required contact method
    if (method === 'email' && !user.email) {
      return res.status(400).json({ error: 'Email not configured for this account' });
    }
    
    if (method === 'sms' && !user.phone_number) {
      return res.status(400).json({ error: 'Phone number not configured for this account' });
    }
    
    // Check if user requires email verification for email OTP
    if (method === 'email' && purpose === 'login' && !user.email_verified) {
      return res.status(403).json({ error: AuthErrors.EMAIL_NOT_VERIFIED });
    }
    
    // Generate OTP code
    const otpCode = generateOTPCode();
    
    // Store OTP in database (expires in 5 minutes)
    await createOTP(user.id, otpCode, method, 5);
    
    // Send OTP
    let sendResult;
    
    if (method === 'email') {
      const emailTemplate = generateOTPEmail(user.email, otpCode);
      sendResult = await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html
      });
    } else if (method === 'sms') {
      const smsMessage = purpose === 'login' 
        ? generateLoginSMS(otpCode)
        : generateOTPSMS(otpCode);
      
      sendResult = await sendSMS({
        to: user.phone_number,
        message: smsMessage
      });
    }
    
    if (!sendResult.success) {
      console.error('OTP send failed:', sendResult.error);
      return res.status(500).json({ 
        error: 'Failed to send OTP',
        details: process.env.NODE_ENV === 'development' ? sendResult.error : undefined
      });
    }
    
    return res.status(200).json({
      message: `OTP sent successfully via ${method}`,
      success: true,
      method,
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { otpCode })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
}

/**
 * Verify OTP code
 */
async function handleVerifyOTP(req, res) {
  const { identifier, code, method } = req.body;
  
  if (!identifier || !code || !method) {
    return res.status(400).json({ 
      error: AuthErrors.MISSING_REQUIRED_FIELD,
      message: 'identifier, code, and method are required'
    });
  }
  
  if (!['sms', 'email'].includes(method)) {
    return res.status(400).json({ 
      error: 'Invalid method. Use: sms or email' 
    });
  }
  
  try {
    let user;
    
    // Find user
    if (typeof identifier === 'number') {
      user = await getUserById(identifier);
    } else if (isValidEmail(identifier)) {
      user = await getUserByEmail(identifier);
    } else if (isValidPhone(identifier)) {
      const formattedPhone = formatPhoneE164(identifier);
      user = await getUserByPhone(formattedPhone);
    } else {
      return res.status(400).json({ 
        error: 'Invalid identifier. Provide email, phone, or userId' 
      });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify OTP using database function
    const result = await verifyOTPDB(user.id, code, method);
    
    if (!result || !result.valid) {
      return res.status(400).json({ 
        error: AuthErrors.INVALID_OTP,
        message: 'Invalid or expired OTP code'
      });
    }
    
    return res.status(200).json({
      message: 'OTP verified successfully',
      valid: true,
      userId: user.id
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
}

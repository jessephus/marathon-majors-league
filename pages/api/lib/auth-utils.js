/**
 * Authentication Utility Functions
 * 
 * Provides core authentication functionality for:
 * - TOTP (Time-Based One-Time Password) generation and verification
 * - OTP (One-Time Password) generation
 * - Magic Link token generation
 * - Session token generation
 * - Encryption/decryption utilities
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ============================================================================
// TOTP (Time-Based One-Time Password) Functions
// ============================================================================

/**
 * Generate a new TOTP secret for a user
 * @returns {string} Base32 encoded secret
 */
export function generateTOTPSecret() {
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for TOTP setup
 * @param {string} userEmail - User's email address
 * @param {string} secret - TOTP secret
 * @param {string} issuer - Service name (default: Marathon Majors League)
 * @returns {Promise<string>} Data URL for QR code image
 */
export async function generateTOTPQRCode(userEmail, secret, issuer = 'Marathon Majors League') {
  const otpauth = authenticator.keyuri(userEmail, issuer, secret);
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Verify a TOTP code against a secret
 * @param {string} token - 6-digit TOTP code from user
 * @param {string} secret - User's TOTP secret
 * @returns {boolean} True if code is valid
 */
export function verifyTOTPCode(token, secret) {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Encrypt TOTP secret for storage
 * Uses AES-256-GCM encryption
 * @param {string} secret - TOTP secret to encrypt
 * @returns {string} Encrypted secret with IV and auth tag (format: iv:authTag:encrypted)
 */
export function encryptTOTPSecret(secret) {
  const encryptionKey = process.env.TOTP_ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('TOTP_ENCRYPTION_KEY environment variable not set');
  }
  
  // Convert encryption key from base64
  const key = Buffer.from(encryptionKey, 'base64');
  
  if (key.length !== 32) {
    throw new Error('TOTP_ENCRYPTION_KEY must be 32 bytes (256 bits)');
  }
  
  // Generate random IV
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt secret
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt TOTP secret from storage
 * @param {string} encryptedData - Encrypted secret (format: iv:authTag:encrypted)
 * @returns {string} Decrypted TOTP secret
 */
export function decryptTOTPSecret(encryptedData) {
  const encryptionKey = process.env.TOTP_ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('TOTP_ENCRYPTION_KEY environment variable not set');
  }
  
  try {
    // Parse encrypted data
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Convert from hex
    const key = Buffer.from(encryptionKey, 'base64');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt TOTP secret: ${error.message}`);
  }
}

/**
 * Generate backup codes for TOTP recovery
 * @param {number} count - Number of backup codes to generate (default: 10)
 * @returns {Promise<Array<{code: string, hash: string}>>} Array of codes and their hashes
 */
export async function generateBackupCodes(count = 10) {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Hash the code for storage (bcrypt with cost factor 12)
    const hash = await bcrypt.hash(code, 12);
    
    codes.push({ code, hash });
  }
  
  return codes;
}

/**
 * Verify a backup code against its hash
 * @param {string} code - Backup code entered by user
 * @param {string} hash - Stored hash of the code
 * @returns {Promise<boolean>} True if code matches
 */
export async function verifyBackupCode(code, hash) {
  try {
    return await bcrypt.compare(code.toUpperCase(), hash);
  } catch (error) {
    console.error('Backup code verification error:', error);
    return false;
  }
}

// ============================================================================
// OTP (One-Time Password) Functions
// ============================================================================

/**
 * Generate a 6-digit numeric OTP code
 * @returns {string} 6-digit OTP code
 */
export function generateOTPCode() {
  // Generate random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Verify an OTP code (simple string comparison)
 * @param {string} enteredCode - Code entered by user
 * @param {string} storedCode - Code stored in database
 * @returns {boolean} True if codes match
 */
export function verifyOTPCode(enteredCode, storedCode) {
  return enteredCode === storedCode;
}

// ============================================================================
// Magic Link Token Functions
// ============================================================================

/**
 * Generate a cryptographically secure token for magic links
 * @param {number} bytes - Number of random bytes (default: 32 = 256 bits)
 * @returns {string} Hex-encoded token
 */
export function generateMagicLinkToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a secure token with URL-safe encoding
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} URL-safe base64 encoded token
 */
export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ============================================================================
// Session Token Functions
// ============================================================================

/**
 * Generate a session token for authentication
 * @returns {string} Cryptographically secure session token
 */
export function generateSessionToken() {
  // Generate 256-bit random token
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a session token for storage
 * Uses SHA-256 for fast verification
 * @param {string} token - Session token to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a session token against a stored hash
 * @param {string} token - Token to verify
 * @param {string} hash - Stored hash
 * @returns {boolean} True if token matches hash
 */
export function verifySessionToken(token, hash) {
  const tokenHash = hashSessionToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a random invite code
 * @param {string} prefix - Prefix for the code (default: 'INV')
 * @param {number} length - Length of random portion (default: 8)
 * @returns {string} Formatted invite code (e.g., 'INV-AB12CD34')
 */
export function generateInviteCode(prefix = 'INV', length = 8) {
  const random = crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .toUpperCase()
    .substring(0, length);
  
  return `${prefix}-${random}`;
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
export function isValidEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (E.164 format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone format is valid (E.164)
 */
export function isValidPhone(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number to format
 * @param {string} defaultCountryCode - Default country code if not provided (default: '+1')
 * @returns {string} E.164 formatted phone number
 */
export function formatPhoneE164(phone, defaultCountryCode = '+1') {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add default country code if not present
  if (!phone.startsWith('+')) {
    // If number doesn't start with country code, add default
    if (cleaned.length === 10) {
      // Assume US number
      cleaned = defaultCountryCode.replace('+', '') + cleaned;
    }
  }
  
  return '+' + cleaned;
}

/**
 * Generate expiration timestamp
 * @param {number} minutes - Minutes from now
 * @returns {Date} Expiration date
 */
export function getExpirationDate(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if a timestamp has expired
 * @param {Date|string} expirationDate - Expiration date to check
 * @returns {boolean} True if expired
 */
export function isExpired(expirationDate) {
  const expiry = typeof expirationDate === 'string' 
    ? new Date(expirationDate) 
    : expirationDate;
  
  return expiry < new Date();
}

/**
 * Rate limiting check (simple implementation)
 * @param {number} attempts - Number of attempts made
 * @param {number} maxAttempts - Maximum allowed attempts
 * @param {Date} firstAttemptAt - Timestamp of first attempt
 * @param {number} windowMinutes - Time window in minutes
 * @returns {Object} { allowed: boolean, remainingAttempts: number, resetAt: Date }
 */
export function checkRateLimit(attempts, maxAttempts, firstAttemptAt, windowMinutes = 60) {
  const resetAt = new Date(firstAttemptAt.getTime() + windowMinutes * 60 * 1000);
  const isWithinWindow = new Date() < resetAt;
  
  if (!isWithinWindow) {
    // Window has expired, reset
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000)
    };
  }
  
  const allowed = attempts < maxAttempts;
  const remainingAttempts = Math.max(0, maxAttempts - attempts);
  
  return { allowed, remainingAttempts, resetAt };
}

// ============================================================================
// Error Messages
// ============================================================================

export const AuthErrors = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_OTP: 'Invalid or expired OTP code',
  INVALID_TOTP: 'Invalid TOTP code',
  INVALID_BACKUP_CODE: 'Invalid backup code',
  EXPIRED_TOKEN: 'Token has expired',
  EXPIRED_OTP: 'OTP has expired',
  EXPIRED_SESSION: 'Session has expired',
  ACCOUNT_DISABLED: 'Account has been disabled',
  EMAIL_NOT_VERIFIED: 'Email address not verified',
  PHONE_NOT_VERIFIED: 'Phone number not verified',
  TOTP_NOT_SETUP: 'TOTP not set up for this account',
  TOTP_ALREADY_SETUP: 'TOTP already set up for this account',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
  INVITE_CODE_INVALID: 'Invalid or expired invite code',
  INVITE_CODE_USED: 'Invite code has already been used',
  USER_ALREADY_EXISTS: 'An account with this email already exists',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_EMAIL_FORMAT: 'Invalid email address format',
  INVALID_PHONE_FORMAT: 'Invalid phone number format (use E.164: +1234567890)',
  SERVICE_UNAVAILABLE: 'Authentication service temporarily unavailable'
};

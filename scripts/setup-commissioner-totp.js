#!/usr/bin/env node

/**
 * Commissioner TOTP Setup Script
 * 
 * This script generates a TOTP secret for the single commissioner,
 * creates a QR code for Google Authenticator, and stores it securely
 * in the database.
 */

import { neon } from '@neondatabase/serverless';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

// Encryption settings (same as in auth-utils.js)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('base64');

function encryptTOTPSecret(secret) {
    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

async function setupCommissionerTOTP() {
    console.log('\n🔐 COMMISSIONER TOTP SETUP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        // 1. Generate TOTP secret
        const secret = speakeasy.generateSecret({
            name: 'Marathon Majors Fantasy League (Commissioner)',
            issuer: 'Marathon Majors League'
        });
        
        console.log('✅ TOTP Secret Generated\n');
        
        // 2. Create QR code
        const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);
        
        // Save QR code to file for easy scanning
        const qrCodeBuffer = await qrcode.toBuffer(secret.otpauth_url);
        const fs = await import('fs');
        fs.writeFileSync('commissioner-totp-qr.png', qrCodeBuffer);
        
        console.log('✅ QR Code Generated: commissioner-totp-qr.png\n');
        
        // 3. Encrypt the secret for storage
        const encryptedData = encryptTOTPSecret(secret.base32);
        
        console.log('✅ Secret Encrypted\n');
        
        // 4. Store in database
        // First, ensure we have a commissioner user record
        await sql`
            INSERT INTO users (
                email,
                display_name,
                is_admin,
                is_staff,
                email_verified,
                totp_enabled
            ) VALUES (
                'commissioner@marathonmajorsfantasy.com',
                'Commissioner',
                true,
                true,
                true,
                true
            )
            ON CONFLICT (email) 
            DO UPDATE SET
                totp_enabled = true,
                updated_at = CURRENT_TIMESTAMP
        `;
        
        // Store the encrypted TOTP secret
        await sql`
            UPDATE users
            SET totp_secret = ${JSON.stringify(encryptedData)},
                totp_verified_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE email = 'commissioner@marathonmajorsfantasy.com'
        `;
        
        console.log('✅ Secret Stored in Database\n');
        
        // 5. Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
            
            // Hash backup code for storage
            const hash = crypto.createHash('sha256').update(code).digest('hex');
            await sql`
                INSERT INTO totp_backup_codes (user_id, code_hash)
                SELECT id, ${hash}
                FROM users
                WHERE email = 'commissioner@marathonmajorsfantasy.com'
            `;
        }
        
        console.log('✅ Backup Codes Generated\n');
        
        // 6. Display setup instructions
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📱 SETUP INSTRUCTIONS:\n');
        console.log('1. Open Google Authenticator (or any TOTP app) on your phone');
        console.log('2. Scan the QR code saved as: commissioner-totp-qr.png');
        console.log('   OR manually enter this secret:');
        console.log(`   ${secret.base32}\n`);
        console.log('3. The app will generate 6-digit codes that change every 30 seconds');
        console.log('4. Use these codes to log in as commissioner\n');
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🔑 BACKUP CODES (Save these somewhere safe!):\n');
        console.log('   Use if you lose access to your authenticator app\n');
        backupCodes.forEach((code, i) => {
            console.log(`   ${i + 1}. ${code}`);
        });
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('🧪 TEST YOUR SETUP:\n');
        console.log('1. Check your authenticator app for the 6-digit code');
        console.log('2. Run: node test-commissioner-totp.js <your-6-digit-code>');
        console.log('3. If successful, you can log in as commissioner!\n');
        
        // Update .env if TOTP_ENCRYPTION_KEY wasn't set
        if (!process.env.TOTP_ENCRYPTION_KEY) {
            console.log('⚠️  IMPORTANT: Add this to your .env file:\n');
            console.log(`TOTP_ENCRYPTION_KEY=${ENCRYPTION_KEY}\n`);
            console.log('(This is required to decrypt the TOTP secret)\n');
        }
        
        console.log('✅ Commissioner TOTP setup complete!\n');
        
    } catch (error) {
        console.error('❌ Error setting up TOTP:', error);
        process.exit(1);
    }
}

// Run setup
setupCommissionerTOTP();

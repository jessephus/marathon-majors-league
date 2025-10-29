#!/usr/bin/env node

/**
 * Test Commissioner TOTP Script
 * 
 * Usage: node test-commissioner-totp.js <6-digit-code>
 */

import { neon } from '@neondatabase/serverless';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

// Encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY;

function decryptTOTPSecret(encryptedData) {
    const key = Buffer.from(ENCRYPTION_KEY, 'base64');
    const decipher = crypto.createDecipheriv(
        ENCRYPTION_ALGORITHM,
        key,
        Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

async function testTOTP() {
    const totpCode = process.argv[2];
    
    if (!totpCode) {
        console.error('\n❌ Please provide a TOTP code');
        console.error('Usage: node test-commissioner-totp.js <6-digit-code>\n');
        process.exit(1);
    }
    
    if (!/^\d{6}$/.test(totpCode)) {
        console.error('\n❌ TOTP code must be exactly 6 digits\n');
        process.exit(1);
    }
    
    if (!ENCRYPTION_KEY) {
        console.error('\n❌ TOTP_ENCRYPTION_KEY not found in .env file\n');
        process.exit(1);
    }
    
    console.log('\n🧪 TESTING COMMISSIONER TOTP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    try {
        // Get commissioner record
        const result = await sql`
            SELECT totp_secret
            FROM users
            WHERE email = 'commissioner@marathonmajorsfantasy.com'
            AND totp_enabled = true
        `;
        
        if (!result || result.length === 0) {
            console.error('❌ Commissioner TOTP not set up');
            console.error('   Run: node setup-commissioner-totp.js\n');
            process.exit(1);
        }
        
        const encryptedData = JSON.parse(result[0].totp_secret);
        const secret = decryptTOTPSecret(encryptedData);
        
        // Verify TOTP code
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: totpCode,
            window: 2  // Allow 1 step before/after for clock skew
        });
        
        if (verified) {
            console.log('✅ SUCCESS! TOTP code verified\n');
            console.log('   You can now log in as commissioner with TOTP codes');
            console.log('   from your authenticator app.\n');
            process.exit(0);
        } else {
            console.log('❌ FAILED! TOTP code is invalid\n');
            console.log('   Common reasons:');
            console.log('   • Code expired (they change every 30 seconds)');
            console.log('   • Wrong code entered');
            console.log('   • Phone clock not synchronized\n');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error testing TOTP:', error.message);
        process.exit(1);
    }
}

testTOTP();

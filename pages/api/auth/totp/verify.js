/**
 * TOTP Verification API for Commissioner Login
 * POST /api/auth/totp/verify
 * 
 * TOTP secrets are stored as plaintext base32 strings in the database.
 * This is standard practice - the secret itself is meant to be protected
 * by database access controls, not additional encryption.
 */

import { neon } from '@neondatabase/serverless';
import * as speakeasy from 'speakeasy';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { email, totpCode } = req.body;
        
        // Validate inputs
        if (!email || !totpCode) {
            return res.status(400).json({ error: 'Email and TOTP code are required' });
        }
        
        if (!/^\d{6}$/.test(totpCode)) {
            return res.status(400).json({ error: 'TOTP code must be 6 digits' });
        }
        
        // Get user with TOTP enabled
        const result = await sql`
            SELECT id, email, totp_secret, totp_enabled
            FROM users
            WHERE email = ${email}
            AND totp_enabled = true
            AND deleted_at IS NULL
        `;
        
        if (!result || result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result[0];
        
        // Get TOTP secret (stored as plaintext base32)
        const secret = user.totp_secret;
        
        // Verify TOTP code
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: totpCode,
            window: 2  // Allow 1 step before/after for clock skew
        });
        
        if (!verified) {
            return res.status(401).json({ error: 'Invalid TOTP code' });
        }
        
        // Success - update last login
        await sql`
            UPDATE users
            SET last_login = CURRENT_TIMESTAMP
            WHERE id = ${user.id}
        `;
        
        // Set commissioner session cookie (HttpOnly for security)
        // 30-day expiration matching localStorage session
        const expiryDays = 30;
        const sessionData = JSON.stringify({
            userId: user.id,
            email: user.email,
            isCommissioner: true,
            loginTime: new Date().toISOString()
        });
        
        res.setHeader('Set-Cookie', [
            `marathon_fantasy_commissioner=${encodeURIComponent(sessionData)}; Path=/; Max-Age=${expiryDays * 24 * 60 * 60}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        ]);
        
        console.log('[TOTP Verify] Set commissioner cookie for user:', user.email);
        
        return res.status(200).json({
            success: true,
            message: 'TOTP verified successfully',
            session: {
                userId: user.id,
                email: user.email,
                isCommissioner: true
            }
        });
        
    } catch (error) {
        console.error('TOTP verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

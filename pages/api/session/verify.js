/**
 * Anonymous Session Verification API
 * 
 * GET /api/session/verify?token={sessionToken} - Verify and get session details
 * 
 * Validates session tokens and returns session information.
 * Updates last_activity timestamp on successful verification.
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Missing session token',
        message: 'Token parameter is required'
      });
    }
    
    // Verify session using database function
    const result = await sql`
      SELECT * FROM verify_anonymous_session(${token})
    `;
    
    if (!result || result.length === 0) {
      return res.status(404).json({ 
        error: 'Session not found',
        valid: false
      });
    }
    
    const session = result[0];
    
    // Check if session is valid
    if (!session.is_valid) {
      return res.status(401).json({ 
        error: 'Session expired or inactive',
        valid: false,
        expiresAt: session.expires_at
      });
    }
    
    // Return session details
    return res.status(200).json({
      valid: true,
      session: {
        id: session.session_id,
        type: session.session_type,
        gameId: session.game_id,
        playerCode: session.player_code,
        displayName: session.display_name,
        expiresAt: session.expires_at,
        daysUntilExpiry: session.days_until_expiry
      },
      warning: session.days_until_expiry < 7 
        ? 'Your session will expire soon. Consider saving your game data or creating an account.'
        : null
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to verify session'
    });
  }
}

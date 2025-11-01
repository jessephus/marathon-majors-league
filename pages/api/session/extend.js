/**
 * Anonymous Session Extension API
 * 
 * POST /api/session/extend - Extend session expiration
 * 
 * Allows users to extend their session expiration to avoid losing access.
 */

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
    const { token, additionalDays = 90 } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Missing session token',
        message: 'Token is required'
      });
    }
    
    // Validate additional days
    if (additionalDays < 1 || additionalDays > 365) {
      return res.status(400).json({ 
        error: 'Invalid additional days',
        message: 'additionalDays must be between 1 and 365'
      });
    }
    
    // Extend session using database function
    const result = await sql`
      SELECT extend_anonymous_session(${token}, ${additionalDays}) as new_expiry
    `;
    
    if (!result || result.length === 0 || !result[0].new_expiry) {
      return res.status(404).json({ 
        error: 'Session not found or already expired',
        message: 'Cannot extend inactive or expired session'
      });
    }
    
    const newExpiry = result[0].new_expiry;
    
    return res.status(200).json({
      message: 'Session extended successfully',
      expiresAt: newExpiry,
      extendedBy: additionalDays
    });
    
  } catch (error) {
    console.error('Session extension error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to extend session'
    });
  }
}

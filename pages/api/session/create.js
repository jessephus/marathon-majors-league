/**
 * Anonymous Session Creation API
 * 
 * POST /api/session/create - Create a new anonymous session
 * 
 * This endpoint allows users to create teams and participate in games
 * without requiring traditional account registration.
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
    const { 
      sessionType = 'player',  // 'commissioner', 'player', or 'spectator'
      displayName,
      gameId,
      playerCode,
      expiryDays = 90
    } = req.body;
    
    // Validate session type
    const validTypes = ['commissioner', 'player', 'spectator'];
    if (!validTypes.includes(sessionType)) {
      return res.status(400).json({ 
        error: 'Invalid session type',
        message: 'sessionType must be one of: commissioner, player, spectator'
      });
    }
    
    // Validate expiry days
    if (expiryDays < 1 || expiryDays > 365) {
      return res.status(400).json({ 
        error: 'Invalid expiry days',
        message: 'expiryDays must be between 1 and 365'
      });
    }
    
    // Get client IP and user agent for security tracking
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] 
      || req.socket?.remoteAddress 
      || null;
    const userAgent = req.headers['user-agent'] || null;
    
    // Create anonymous session using database function
    const result = await sql`
      SELECT * FROM create_anonymous_session(
        ${sessionType},
        ${displayName || null},
        ${gameId || null},
        ${playerCode || null},
        ${ipAddress}::inet,
        ${userAgent},
        ${expiryDays}
      )
    `;
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create anonymous session');
    }
    
    const session = result[0];
    
    // Return session details
    return res.status(201).json({
      message: 'Anonymous session created successfully',
      session: {
        token: session.session_token,
        expiresAt: session.expires_at,
        sessionType,
        displayName: displayName || null,
        gameId: gameId || null
      },
      // Generate unique URL for this session
      uniqueUrl: gameId 
        ? `${req.headers.origin || 'http://localhost:3000'}/?session=${session.session_token}&game=${gameId}`
        : `${req.headers.origin || 'http://localhost:3000'}/?session=${session.session_token}`,
      instructions: sessionType === 'commissioner'
        ? 'Save this URL to return to your game as commissioner. Share unique player URLs with your friends.'
        : 'Save this URL to return to your game. You can bookmark it or save it to your home screen.'
    });
    
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to create session'
    });
  }
}

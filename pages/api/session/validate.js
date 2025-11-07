import { neon } from '@neondatabase/serverless';

/**
 * Validate Session Token API Endpoint
 * 
 * Validates a session token and returns the full session details if valid.
 * Used when restoring sessions from URL parameters.
 */
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

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ 
      valid: false,
      error: 'Session token is required' 
    });
  }

  // Validate token format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return res.status(400).json({ 
      valid: false,
      error: 'Invalid session token format' 
    });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return res.status(500).json({ 
      valid: false,
      error: 'Database not configured' 
    });
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log('[Validate API] Looking up session token:', token);
    
    // Look up the session in the database
    const sessions = await sql`
      SELECT 
        session_token,
        expires_at,
        session_type,
        display_name,
        game_id,
        player_code,
        is_active,
        created_at
      FROM anonymous_sessions
      WHERE session_token = ${token}
        AND is_active = true
      LIMIT 1
    `;

    console.log('[Validate API] Found sessions:', sessions.length);

    if (sessions.length === 0) {
      return res.status(404).json({ 
        valid: false,
        error: 'Session not found or inactive' 
      });
    }

    const session = sessions[0];

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    console.log('[Validate API] Checking expiration - now:', now.toISOString(), 'expires:', expiresAt.toISOString());

    if (expiresAt <= now) {
      // Mark session as inactive
      console.log('[Validate API] Session expired, marking as inactive');
      await sql`
        UPDATE anonymous_sessions 
        SET is_active = false 
        WHERE session_token = ${token}
      `;

      return res.status(401).json({ 
        valid: false,
        error: 'Session has expired' 
      });
    }

    // Session is valid - set cookie for SSR session detection
    const maxAge = Math.floor((expiresAt - now) / 1000); // seconds until expiry
    const cookieValue = JSON.stringify({
      token: session.session_token,
      sessionType: session.session_type,
      displayName: session.display_name,
      gameId: session.game_id,
      playerCode: session.player_code
    });
    
    res.setHeader('Set-Cookie', [
      `marathon_fantasy_team=${encodeURIComponent(cookieValue)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);
    
    console.log('[Validate API] Session valid, set cookie and returning details for:', session.display_name);
    return res.status(200).json({
      valid: true,
      session: {
        sessionToken: session.session_token,
        expiresAt: session.expires_at,
        sessionType: session.session_type,
        displayName: session.display_name,
        gameId: session.game_id,
        playerCode: session.player_code,
        createdAt: session.created_at
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return res.status(500).json({ 
      valid: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to validate session'
    });
  }
}

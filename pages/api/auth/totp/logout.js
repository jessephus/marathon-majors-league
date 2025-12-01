/**
 * Commissioner Logout API
 * POST /api/auth/totp/logout
 * 
 * Clears the commissioner session cookie.
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
    
      try {
          // Clear BOTH commissioner cookies (session + game selection) by setting Max-Age to 0
          res.setHeader('Set-Cookie', [
              `marathon_fantasy_commissioner=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
              `current_game_id=; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
          ]);          console.log('[TOTP Logout] Cleared commissioner session and game selection cookies');        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

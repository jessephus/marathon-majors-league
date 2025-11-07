/**
 * API endpoint to logout and clear session cookie
 * POST /api/session/logout
 * 
 * Since the session cookie is HttpOnly, JavaScript cannot delete it.
 * This endpoint clears the cookie server-side.
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
    console.log('[Session Logout] Clearing session cookie');

    // Clear the session cookie by setting it with an expired date
    // Must match the exact same attributes as when it was set (Path, SameSite, etc.)
    res.setHeader('Set-Cookie', [
      `marathon_fantasy_team=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    console.log('[Session Logout] Session cookie cleared');

    return res.status(200).json({
      message: 'Logout successful',
      cookieCleared: true
    });
  } catch (error) {
    console.error('[Session Logout] Error:', error);
    return res.status(500).json({ 
      error: 'Logout failed',
      details: error.message 
    });
  }
}

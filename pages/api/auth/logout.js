/**
 * API endpoint to logout commissioner and clear session cookie
 * POST /api/auth/logout
 * 
 * Since the commissioner cookie is HttpOnly, JavaScript cannot delete it.
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
    console.log('[Commissioner Logout] Clearing commissioner session cookie');

    // Clear the commissioner session cookie by setting it with an expired date
    // Must match the exact same attributes as when it was set (Path, SameSite, etc.)
    res.setHeader('Set-Cookie', [
      `marathon_fantasy_commissioner=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    console.log('[Commissioner Logout] Commissioner cookie cleared');

    return res.status(200).json({
      message: 'Commissioner logout successful',
      cookieCleared: true
    });
  } catch (error) {
    console.error('[Commissioner Logout] Error:', error);
    return res.status(500).json({ 
      error: 'Logout failed',
      details: error.message 
    });
  }
}

/**
 * Session Management API
 * 
 * GET /api/auth/session - Verify and retrieve current session
 * DELETE /api/auth/session - Logout (revoke session)
 */

import { verifySession, revokeSession, revokeAllUserSessions, getUserById } from '../db.js';
import { AuthErrors } from '../lib/auth-utils.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (req.method === 'GET') {
      return await handleGetSession(req, res);
    } else if (req.method === 'DELETE') {
      return await handleDeleteSession(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Session API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get current session information
 */
async function handleGetSession(req, res) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  
  if (!sessionToken) {
    return res.status(401).json({ 
      error: 'No session token provided',
      message: 'Provide token in Authorization header or query parameter'
    });
  }
  
  try {
    // Verify session
    const session = await verifySession(sessionToken);
    
    if (!session || !session.valid) {
      return res.status(401).json({ error: AuthErrors.EXPIRED_SESSION });
    }
    
    // Get user details
    const user = await getUserById(session.user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: AuthErrors.ACCOUNT_DISABLED });
    }
    
    return res.status(200).json({
      valid: true,
      session: {
        userId: session.user_id,
        createdAt: session.created_at,
        expiresAt: session.expires_at
      },
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        totpEnabled: user.totp_enabled,
        isAdmin: user.is_admin,
        isStaff: user.is_staff
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    return res.status(500).json({ error: 'Failed to verify session' });
  }
}

/**
 * Delete session (logout)
 */
async function handleDeleteSession(req, res) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.body?.token;
  const allDevices = req.body?.allDevices || false;
  
  if (!sessionToken) {
    return res.status(400).json({ 
      error: 'No session token provided',
      message: 'Provide token in Authorization header or request body'
    });
  }
  
  try {
    // Verify session first to get user_id
    const session = await verifySession(sessionToken);
    
    if (!session || !session.valid) {
      // Session already invalid or expired
      return res.status(200).json({ 
        message: 'Session already invalid or expired'
      });
    }
    
    if (allDevices) {
      // Revoke all sessions for this user
      await revokeAllUserSessions(session.user_id);
      return res.status(200).json({ 
        message: 'Logged out from all devices successfully'
      });
    } else {
      // Revoke only this session
      await revokeSession(sessionToken);
      return res.status(200).json({ 
        message: 'Logged out successfully'
      });
    }
  } catch (error) {
    console.error('Delete session error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
}

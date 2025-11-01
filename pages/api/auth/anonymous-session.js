/**
 * Anonymous Session Creation API
 * POST /api/auth/anonymous-session - Create a new anonymous session
 */

import { createAnonymousSession } from '../db.js';

export default async function handler(req, res) {
  // Set CORS headers
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
    const { type, displayName, gameId, playerCode, expiryDays } = req.body;
    
    // Validate required fields
    if (!type) {
      return res.status(400).json({ 
        error: 'Session type is required',
        message: 'Provide type: "team" or "commissioner"'
      });
    }
    
    if (!['team', 'commissioner'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid session type',
        message: 'Type must be "team" or "commissioner"'
      });
    }
    
    // Create the session
    const session = await createAnonymousSession({
      type,
      displayName,
      gameId,
      playerCode,
      expiryDays: expiryDays || 90
    });
    
    return res.status(201).json({
      success: true,
      token: session.token,
      expiresAt: session.expiresAt,
      message: 'Anonymous session created successfully'
    });
    
  } catch (error) {
    console.error('Anonymous session creation error:', error);
    return res.status(500).json({ 
      error: 'Failed to create session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

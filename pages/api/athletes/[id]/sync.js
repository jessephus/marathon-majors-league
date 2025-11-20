import handler from '../../sync-athlete.js';

/**
 * Dynamic route for athlete sync
 * 
 * POST /api/athletes/[id]/sync
 * 
 * Wraps the sync-athlete endpoint to support RESTful URL pattern
 */
export default async function syncHandler(req, res) {
  // Extract athlete ID from URL
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Athlete ID is required' });
  }

  // Add athleteId to request body
  req.body = {
    ...req.body,
    athleteId: parseInt(id, 10)
  };

  // Delegate to the existing sync-athlete handler
  return handler(req, res);
}

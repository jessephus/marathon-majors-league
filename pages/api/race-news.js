import { getRaceNews, getRaceNewsById, createRaceNews, updateRaceNews, deleteRaceNews } from './db';

/**
 * Race News API
 * 
 * Manages curated news items for races.
 * 
 * GET    - List news for a race
 * POST   - Create a new news item
 * PUT    - Update an existing news item
 * DELETE - Delete a news item
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id, raceId, includeHidden } = req.query;

    if (req.method === 'GET') {
      // Get specific news item by ID
      if (id) {
        const news = await getRaceNewsById(parseInt(id));
        if (!news) {
          return res.status(404).json({ error: 'News item not found' });
        }
        return res.status(200).json(news);
      }

      // Get all news for a race
      if (raceId) {
        const visibleOnly = includeHidden !== 'true';
        const news = await getRaceNews(parseInt(raceId), visibleOnly);
        return res.status(200).json(news);
      }

      return res.status(400).json({ 
        error: 'Either id or raceId is required' 
      });

    } else if (req.method === 'POST') {
      // Create a new news item
      const newsData = req.body;

      if (!newsData.raceId || !newsData.headline) {
        return res.status(400).json({
          error: 'Missing required fields: raceId, headline'
        });
      }

      const news = await createRaceNews(newsData);
      return res.status(201).json(news);

    } else if (req.method === 'PUT') {
      // Update an existing news item
      if (!id) {
        return res.status(400).json({ 
          error: 'News item ID is required for updates' 
        });
      }

      const updates = req.body;
      const news = await updateRaceNews(parseInt(id), updates);
      
      if (!news) {
        return res.status(404).json({ error: 'News item not found' });
      }
      
      return res.status(200).json(news);

    } else if (req.method === 'DELETE') {
      // Delete a news item
      if (!id) {
        return res.status(400).json({ 
          error: 'News item ID is required for deletion' 
        });
      }

      const deletedNews = await deleteRaceNews(parseInt(id));
      return res.status(200).json({
        success: true,
        message: `News item "${deletedNews.headline}" has been deleted`,
        news: deletedNews
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Race News API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

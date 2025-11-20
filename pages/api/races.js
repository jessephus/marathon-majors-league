import { getAllRaces, getActiveRaces, getRaceById, createRace, updateRace, deleteRace, getAthletesForRace } from './db';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id, active } = req.query;

    if (req.method === 'GET') {
      // Get specific race by ID
      if (id) {
        const race = await getRaceById(parseInt(id));
        if (!race) {
          return res.status(404).json({ error: 'Race not found' });
        }
        
        // Optionally include athletes for this race
        const includeAthletes = req.query.includeAthletes === 'true';
        if (includeAthletes) {
          race.athletes = await getAthletesForRace(race.id);
        }
        
        return res.status(200).json(race);
      }
      
      // Get all races or just active ones
      const races = active === 'true' ? await getActiveRaces() : await getAllRaces();
      res.status(200).json(races);
      
    } else if (req.method === 'POST') {
      // Create a new race
      const raceData = req.body;
      
      if (!raceData.name || !raceData.date || !raceData.location) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, date, location' 
        });
      }
      
      const race = await createRace(raceData);
      res.status(201).json(race);
      
    } else if (req.method === 'PUT') {
      // Update an existing race
      if (!id) {
        return res.status(400).json({ error: 'Race ID is required for updates' });
      }
      
      const updates = req.body;
      const race = await updateRace(parseInt(id), updates);
      res.status(200).json(race);
      
    } else if (req.method === 'DELETE') {
      // Delete a race
      if (!id) {
        return res.status(400).json({ error: 'Race ID is required for deletion' });
      }
      
      const deletedRace = await deleteRace(parseInt(id));
      res.status(200).json({ 
        success: true,
        message: `Race "${deletedRace.name}" has been deleted`,
        race: deletedRace
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Races API error:', error);
    res.status(500).json({ error: error.message });
  }
}

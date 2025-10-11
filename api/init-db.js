export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // With Blob storage, no database initialization is needed
    // Data is created automatically when first accessed
    res.status(200).json({ 
      message: 'Blob storage initialized successfully',
      info: 'No setup required - data will be created on first use',
      storage: 'Vercel Blob'
    });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: error.message });
  }
}

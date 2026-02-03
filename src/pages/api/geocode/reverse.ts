import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    // It's good practice to set a user agent for the OSM API
    const nominatimRes = await fetch(url, {
      headers: {
        'User-Agent': 'AverzoApp/1.0 (contact@averzo.com)', 
      },
    });

    if (!nominatimRes.ok) {
      const errorText = await nominatimRes.text();
      return res.status(nominatimRes.status).json({ error: `Nominatim API error: ${errorText}` });
    }

    const data = await nominatimRes.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Reverse geocoding proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

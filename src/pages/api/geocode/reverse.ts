import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Averzo/1.0 (Firebase Studio)' // OSM requires a User-Agent
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from OSM: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Reverse geocoding proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch address', details: error.message });
  }
}

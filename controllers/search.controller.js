import { searchManga } from '../services/data.service.js';

export async function search(req, res) {
  try {
    const { q = '', genre, type, status, page = 1 } = req.query;
    const data = await searchManga(q, { genre, type, status, page: parseInt(page) });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import { searchManga } from '../services/data.service.js';

export async function search(req, res) {
  try {
    const { q = '', genre, genres, excludeGenres, type, status, rating, sort, page = 1 } = req.query;
    const data = await searchManga(q, {
      genre,
      genres,         // comma-separated list for multi-tag
      excludeGenres,  // comma-separated list for excluded tags
      type,
      status,
      rating,
      sort,           // follows | rating | update | title
      page: parseInt(page),
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

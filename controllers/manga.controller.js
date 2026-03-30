import {
  getPopularManga,
  getMangaDetail,
  getLatestUpdates,
  ALL_GENRES,
} from '../services/data.service.js';

export async function listManga(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await getPopularManga(page);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getManga(req, res) {
  try {
    const { id } = req.params;
    const data = await getMangaDetail(id);
    if (!data) return res.status(404).json({ error: 'Manga not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function latestUpdates(req, res) {
  try {
    const data = await getLatestUpdates();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getGenres(req, res) {
  res.json(ALL_GENRES);
}

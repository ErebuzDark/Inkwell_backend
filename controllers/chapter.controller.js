import { getChapterPages } from '../services/data.service.js';

export async function getChapter(req, res) {
  try {
    const { id } = req.params;
    const data = await getChapterPages(id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

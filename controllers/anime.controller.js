import { ANIME } from '@consumet/extensions';

const provider = new ANIME.AnimeKai();
// Fallback provider if needed
// const hianime = new ANIME.Hianime();

export const listAnime = async (req, res) => {
  try {
    const { page = 1, type, genre } = req.query;
    const pageNum = parseInt(page);
    
    let data;
    if (genre) {
      // Genre search priority
      data = await provider.genreSearch(genre, pageNum);
    } else if (type && type !== 'All') {
      // Type listing
      const typeMethodMap = {
        'Movie': 'fetchMovie',
        'TV': 'fetchTV',
        'OVA': 'fetchOVA',
        'ONA': 'fetchONA',
        'Special': 'fetchSpecial'
      };
      const method = typeMethodMap[type] || 'fetchNewReleases';
      data = await provider[method](pageNum);
    } else {
      // Default listing
      data = await provider.fetchNewReleases(pageNum);
    }
    
    res.json({ source: 'consumet (animekai)', ...data });
  } catch (error) {
    console.error('listAnime Error:', error);
    res.status(500).json({ error: 'Failed to fetch anime list' });
  }
};

export const getTrending = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const data = await provider.fetchRecentlyUpdated(page);
    res.json({ source: 'consumet (animekai)', ...data });
  } catch (error) {
    console.error('getTrending Error:', error);
    res.status(500).json({ error: 'Failed to fetch trending anime' });
  }
};

export const searchAnime = async (req, res) => {
  try {
    const { q, page } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing search query' });
    
    const pageNum = page ? parseInt(page) : 1;
    const data = await provider.search(q, pageNum);
    res.json({ source: 'consumet (animekai)', ...data });
  } catch (error) {
    console.error('searchAnime Error:', error);
    res.status(500).json({ error: 'Failed to search anime' });
  }
};

export const getAnimeInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await provider.fetchAnimeInfo(id);
    res.json({ source: 'consumet (animekai)', ...data });
  } catch (error) {
    console.error('getAnimeInfo Error:', error);
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
};

export const getEpisodeWatchLinks = async (req, res) => {
  try {
    const { episodeId } = req.params;
    const data = await provider.fetchEpisodeSources(episodeId);
    res.json({ source: 'consumet (animekai)', ...data });
  } catch (error) {
    console.error('getEpisodeWatchLinks Error:', error);
    res.status(500).json({ error: 'Failed to fetch episode links' });
  }
};

export const getGenres = async (req, res) => {
  try {
    const data = await provider.fetchGenres();
    res.json(data);
  } catch (error) {
    console.error('getGenres Error:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
};

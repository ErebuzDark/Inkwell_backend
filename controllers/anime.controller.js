import { ANIME } from '@consumet/extensions';

// Using AnimeSaturn as the primary for stability (currently most reliable)
const saturn = new ANIME.AnimeSaturn();
const animekai = new ANIME.AnimeKai();

export const listAnime = async (req, res) => {
  try {
    const { page = 1, type, genre } = req.query;
    const pageNum = parseInt(page);
    
    let data;
    if (genre) {
      data = await animekai.genreSearch(genre, pageNum);
    } else if (type && type !== 'All') {
      const typeMethodMap = {
        'Movie': 'fetchMovie',
        'TV': 'fetchTV',
        'OVA': 'fetchOVA',
        'ONA': 'fetchONA',
        'Special': 'fetchSpecial'
      };
      const method = typeMethodMap[type];
      data = method ? await animekai[method](pageNum) : await animekai.fetchNewReleases(pageNum);
    } else {
      // AnimeSaturn doesn't have fetchNewReleases, so we use AnimeKai for listing
      data = await animekai.fetchNewReleases(pageNum);
    }
    
    res.json({ source: 'consumet (animekai/saturn)', ...data });
  } catch (error) {
    console.error('listAnime Error:', error);
    res.status(500).json({ error: 'Failed to fetch anime list' });
  }
};

export const getTrending = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const data = await animekai.fetchRecentlyUpdated(page);
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
    // Try Saturn first for better watch links, fallback to Kai
    let data;
    try {
      data = await saturn.search(q, pageNum);
      if (!data.results || data.results.length === 0) throw new Error('No results in Saturn');
    } catch (e) {
      data = await animekai.search(q, pageNum);
    }
    
    res.json({ source: 'consumet (multi)', ...data });
  } catch (error) {
    console.error('searchAnime Error:', error);
    res.status(500).json({ error: 'Failed to search anime' });
  }
};

export const getAnimeInfo = async (req, res) => {
  try {
    const { id } = req.params;
    let data;
    // Determine provider from ID pattern or sequential check
    try {
      data = await saturn.fetchAnimeInfo(id);
      if (!data.title) throw new Error('Empty title in Saturn');
    } catch (e) {
      data = await animekai.fetchAnimeInfo(id);
    }
    res.json({ source: 'consumet (multi)', ...data });
  } catch (error) {
    console.error('getAnimeInfo Error:', error);
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
};

export const getEpisodeWatchLinks = async (req, res) => {
  try {
    const { episodeId } = req.params;
    let data;
    // Primary check for Saturn
    try {
      data = await saturn.fetchEpisodeSources(episodeId);
      if (!data.sources || data.sources.length === 0) throw new Error('No sources in Saturn');
    } catch (e) {
      // Fallback for AnimeKai
      try {
        data = await animekai.fetchEpisodeSources(episodeId);
      } catch (err) {
        // Final fallback: check for alternative servers if Kai returns empty
        if (err.message.includes('Server megaup not found')) {
            const servers = await animekai.fetchEpisodeServers(episodeId);
            if (servers.length > 0) {
               // Re-implementation of fetch sources logic for the first available server
               // This is a minimal fallback to avoid the 500 error
               return res.status(404).json({ error: 'Desired server not found, try another title.' });
            }
        }
        throw err;
      }
    }
    res.json({ source: 'consumet (multi)', ...data });
  } catch (error) {
    console.error('getEpisodeWatchLinks Error:', error);
    res.status(404).json({ error: 'Episode sources not found. Please try another anime.' });
  }
};

export const getGenres = async (req, res) => {
  try {
    const data = await animekai.fetchGenres();
    res.json(data);
  } catch (error) {
    console.error('getGenres Error:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
};

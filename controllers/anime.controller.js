import { ANIME } from '@consumet/extensions';

// Using AnimeSaturn as the primary for stability (currently most reliable)
const saturn = new ANIME.AnimeSaturn();
const animekai = new ANIME.AnimeKai();

// Helper to sanitize headers for safe Base64 encoding on the frontend
const sanitizeHeaders = (headers) => {
  if (!headers) return null;
  const clean = {};
  for (const [key, value] of Object.entries(headers)) {
    // Only keep essential headers and ensure values are strings and mostly ASCII
    if (['referer', 'user-agent', 'cookie', 'Referer', 'User-Agent', 'Cookie'].includes(key)) {
      clean[key] = String(value).replace(/[^\x00-\x7F]/g, '');
    }
  }
  return Object.keys(clean).length > 0 ? clean : null;
};

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
    
    // First try fetching directly from Saturn (most reliable streams against DC IP blocks)
    try {
      data = await saturn.fetchAnimeInfo(id);
      if (!data.title) throw new Error('Empty title in Saturn');
    } catch (e) {
      // If Saturn tracking fails (e.g. AnimeKai IDs from homepage/trending),
      // fetch from Kai to get the title, then transparently bridge back to Saturn.
      const kaiData = await animekai.fetchAnimeInfo(id);
      if (kaiData && kaiData.title) {
        try {
          // Attempt to map the Kai title back to a Saturn entry
          const saturnSearch = await saturn.search(kaiData.title);
          if (saturnSearch.results && saturnSearch.results.length > 0) {
            data = await saturn.fetchAnimeInfo(saturnSearch.results[0].id);
          } else {
            data = kaiData; 
          }
        } catch (bridgeErr) {
          data = kaiData;
        }
      } else {
        data = kaiData;
      }
    }
    
    res.json({ source: 'consumet (multi)', ...data });
  } catch (error) {
    console.error('getAnimeInfo Error:', error);
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
};

export const getEpisodeWatchLinks = async (req, res) => {
  const { episodeId } = req.params;
  const userAgent = req.headers['user-agent'] || 'unknown';
  console.log(`\n📺 Watch Request: ${episodeId}`);
  console.log(`📱 User-Agent: ${userAgent}`);

  try {
    let data;
    // Primary check for Saturn
    try {
      console.log(`🔍 Trying Saturn for ${episodeId}...`);
      data = await saturn.fetchEpisodeSources(episodeId);
      if (!data.sources || data.sources.length === 0) throw new Error('No sources in Saturn');
      console.log(`✅ Success (Saturn)`);
    } catch (e) {
      // Fallback for AnimeKai
      try {
        console.log(`🔍 Falling back to AnimeKai for ${episodeId}... (Saturn failed: ${e.message})`);
        data = await animekai.fetchEpisodeSources(episodeId);
        console.log(`✅ Success (AnimeKai)`);
      } catch (err) {
        console.warn(`❌ All providers failed for ${episodeId}: ${err.message}`);
        // Final fallback: check for alternative servers if Kai returns empty
        if (err.message.includes('Server megaup not found')) {
            const servers = await animekai.fetchEpisodeServers(episodeId);
            if (servers.length > 0) {
               return res.status(404).json({ error: 'Desired server not found, try another title.' });
            }
        }
        throw err;
      }
    }
    res.json({ 
      source: 'consumet (multi)', 
      ...data,
      headers: sanitizeHeaders(data.headers)
    });
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

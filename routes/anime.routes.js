import { Router } from 'express';
import { listAnime, getTrending, searchAnime, getAnimeInfo, getEpisodeWatchLinks, getGenres } from '../controllers/anime.controller.js';

const router = Router();

router.get('/', listAnime);
router.get('/genres', getGenres);
router.get('/trending', getTrending);
router.get('/search', searchAnime);
router.get('/info/:id', getAnimeInfo);
router.get('/watch/:episodeId', getEpisodeWatchLinks);

export default router;

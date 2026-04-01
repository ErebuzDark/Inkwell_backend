import { Router } from 'express';
import { listManga, getManga, latestUpdates, getGenres, getRatings, getRelated, getTrending } from '../controllers/manga.controller.js';

const router = Router();

router.get('/', listManga);
router.get('/latest', latestUpdates);
router.get('/trending', getTrending);
router.get('/genres', getGenres);
router.get('/ratings', getRatings);
router.get('/:id/related', getRelated);
router.get('/:id', getManga);

export default router;

import { Router } from 'express';
import { listManga, getManga, latestUpdates, getGenres } from '../controllers/manga.controller.js';

const router = Router();

router.get('/', listManga);
router.get('/latest', latestUpdates);
router.get('/genres', getGenres);
router.get('/:id', getManga);

export default router;

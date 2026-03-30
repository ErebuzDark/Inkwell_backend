import { Router } from 'express';
import { getChapter } from '../controllers/chapter.controller.js';

const router = Router();
router.get('/:id', getChapter);

export default router;

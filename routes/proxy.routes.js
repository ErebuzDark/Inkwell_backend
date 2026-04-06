import { Router } from 'express';
import { proxyStream } from '../controllers/proxy.controller.js';

const router = Router();

router.get('/', proxyStream);

export default router;

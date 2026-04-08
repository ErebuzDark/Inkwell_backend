import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mangaRoutes from './routes/manga.routes.js';
import chapterRoutes from './routes/chapter.routes.js';
import searchRoutes from './routes/search.routes.js';
import animeRoutes from './routes/anime.routes.js';
import proxyRoutes from './routes/proxy.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:8080', 'https://inkwell-frontend-olive.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Expose data-source in response headers
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object' && body.source) {
      res.setHeader('X-Data-Source', body.source);
    }
    return originalJson(body);
  };
  next();
});

// Rate limiter: exclude proxy from general limits to avoid blocking media/images
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Increased general limit
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path.startsWith('/api/proxy')
});
app.use('/api', limiter);

app.use('/api/manga', mangaRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/proxy', proxyRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dataStrategy: 'MangaDex API (Exclusive)',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  Inkwell API  →  http://localhost:${PORT} (and 0.0.0.0)`);
  console.log(`📡  Strategy: MangaDex API (Exclusive)\n`);
});
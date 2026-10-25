import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import extractRoutes from './routes/extract.js';
import analyzeRoutes from './routes/analyze.js';
import liveNewsRoutes from './routes/liveNews.js';
import configRoutes from './routes/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

// Load environment variables from server/.env or root/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Allows Google Fonts and frontend bundle in production
}));
app.use(cors({
  origin: '*', // Allows client development on Vite and production builds
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-key', 'x-factcheck-key', 'x-newsapi-key']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'TruthLens AI Verification API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/extract', extractRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/live-news', liveNewsRoutes);
app.use('/api/config', configRoutes);

// Serve compiled static frontend in production if dist exists
if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for API requests
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('TruthLens Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` TruthLens AI Fact-Checking Backend Running`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Health: http://localhost:${PORT}/health`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});

export default app;

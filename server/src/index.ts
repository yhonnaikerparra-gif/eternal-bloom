import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { getDatabase, closeDatabase } from './db/index.js';
import { Scheduler } from './services/scheduler.js';
import { authRouter } from './routes/authRoutes.js';
import { lettersRouter } from './routes/lettersRoutes.js';
import { gardenRouter } from './routes/gardenRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { webhookRouter } from './routes/webhookRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/letters', lettersRouter);
app.use('/api/garden', gardenRouter);
app.use('/api/admin', adminRouter);
app.use('/api/webhooks', webhookRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ETERNAL BLOOM',
    time: new Date().toISOString(),
    timezone: config.timezone,
  });
});

// Serve frontend in production
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Initialize database & persistent scheduler
getDatabase();
Scheduler.init();

const server = app.listen(config.port, () => {
  console.log(`🌸 ETERNAL BLOOM server running on http://localhost:${config.port}`);
  console.log(`⏰ Scheduler configured for 05:00 AM (${config.timezone})`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  closeDatabase();
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Shutting down server gracefully...');
  closeDatabase();
  server.close(() => process.exit(0));
});

export default app;

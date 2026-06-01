import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import logsRoutes from './routes/logs';
import suggestionsRoutes from './routes/suggestions';
import teamRoutes from './routes/team';
import calendarRoutes from './routes/calendar';

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

// Security middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.disable('x-powered-by');

// Global rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/calendar', calendarRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Global error handler — never leak stack traces
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`✅  Server running on http://localhost:${PORT}`);
});

export default app;

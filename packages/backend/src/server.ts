import express from 'express';
import cors from 'cors';
import habitsRouter from './routes/habits';
import settingsRouter from './routes/settings';
import statusRouter from './routes/status';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/habits', habitsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api', statusRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

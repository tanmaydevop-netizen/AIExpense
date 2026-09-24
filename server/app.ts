import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budgets.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ExpenseAI API',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

export default app;
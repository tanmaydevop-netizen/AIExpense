import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth.js';
import expenseRoutes from './server/routes/expenses.js';
import budgetRoutes from './server/routes/budgets.js';
import analyticsRoutes from './server/routes/analytics.js';
import aiRoutes from './server/routes/ai.js';
import profileRoutes from './server/routes/profile.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
const PORT = Number(process.env.PORT) || 3000;

  // Basic security and parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ExpenseAI API',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Project ZIP download endpoint
  app.get('/api/download-zip', (req, res) => {
    try {
      execSync(`python3 -c '
import os, zipfile
exclude_dirs = {"node_modules", "dist", ".git", ".system_generated", ".aistudio"}
exclude_exts = {".zip", ".pyc"}
with zipfile.ZipFile("expenseai-project.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk("."):
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith(".")]
        for file in files:
            if file == "expenseai-project.zip" or any(file.endswith(ext) for ext in exclude_exts):
                continue
            filepath = os.path.join(root, file)
            arcname = os.path.relpath(filepath, ".")
            zipf.write(filepath, arcname)
'`);
      const zipPath = path.resolve(process.cwd(), 'expenseai-project.zip');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="expenseai-project.zip"');
      res.sendFile(zipPath);
    } catch (err) {
      console.error('Error generating project zip:', err);
      res.status(500).json({ error: 'Failed to generate project zip file' });
    }
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/profile', profileRoutes);

  // Fallback for missing API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ExpenseAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

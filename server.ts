import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import app from './server/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

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

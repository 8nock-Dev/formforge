require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { initDb }     = require('./config/db');
const authRoutes     = require('./routes/auth');
const formRoutes     = require('./routes/forms');
const submitRoutes   = require('./routes/submit');

const app = express();

// ─── Middleware ───────────────────────────────────────────
// Dashboard API: strict CORS from the frontend origin
app.use('/api', cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/forms', formRoutes);

// Public form submission endpoint — CORS is handled per-form inside the route
// Note: no global CORS middleware here so we can set per-form Allow-Origin headers
app.use('/f', submitRoutes);

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'formforge' }));

// 404
app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`\n🔧 FormForge backend → http://localhost:${PORT}`);
    console.log(`   Submit endpoint: POST http://localhost:${PORT}/f/:token`);
    console.log(`   Dashboard API:   http://localhost:${PORT}/api\n`);
  });
}

start().catch(err => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});

module.exports = app;

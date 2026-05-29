const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

async function initDb() {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, '../../migrations/001_initial.sql');
    if (fs.existsSync(sqlPath)) {
      await client.query(fs.readFileSync(sqlPath, 'utf8'));
      console.log('[DB] Schema applied');
    }
    console.log('[DB] Connected to PostgreSQL');
  } catch (err) {
    console.error('[DB] Init failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };

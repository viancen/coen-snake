const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// SQLite: use env path, or a "data" folder (writable on most servers)
const defaultDir = path.join(__dirname, 'data');
const dbPath = process.env.SQLITE_DB_PATH || path.join(defaultDir, 'scores.db');

// Ensure directory exists and is writable (for Laravel Forge / shared hosting)
if (!process.env.SQLITE_DB_PATH) {
  try {
    fs.mkdirSync(defaultDir, { recursive: true });
  } catch (e) {
    console.error('Could not create data dir:', e.message);
  }
}

let db;
try {
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_score ON scores(score DESC);
  `);
  console.log('SQLite database ready at', dbPath);
} catch (e) {
  console.error('SQLite failed to open:', e.message);
  console.error('Ensure the directory is writable. Set SQLITE_DB_PATH to a writable path if needed.');
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET top scores (default 10)
app.get('/api/scores', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const rows = db.prepare(
      'SELECT id, player_name, score, created_at FROM scores ORDER BY score DESC LIMIT ?'
    ).all(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new score
app.post('/api/scores', (req, res) => {
  try {
    const { player_name, score } = req.body;
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    const name = (player_name || 'Anon').toString().trim().slice(0, 50) || 'Anon';
    const result = db.prepare('INSERT INTO scores (player_name, score) VALUES (?, ?)').run(name, score);
    res.status(201).json({
      id: result.lastInsertRowid,
      player_name: name,
      score,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nasty Snake server running on http://0.0.0.0:${PORT}`);
});

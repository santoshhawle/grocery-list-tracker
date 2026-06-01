// node:sqlite is built into Node.js 22+ (requires --experimental-sqlite flag)
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new DatabaseSync(path.join(DATA_DIR, 'wellbeing.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    name          TEXT    NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user','manager')),
    team_id       INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wellbeing_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       TEXT    NOT NULL,
    mood       INTEGER NOT NULL CHECK (mood   >= 1 AND mood   <= 10),
    energy     INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 10),
    focus      INTEGER NOT NULL CHECK (focus  >= 1 AND focus  <= 10),
    notes      TEXT,
    work_hours REAL    DEFAULT 8 CHECK (work_hours >= 0 AND work_hours <= 24),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
  );
`);

// Seed demo user on first run
const demoEmail = 'demo@example.com';
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
if (!existing) {
  const hash = bcrypt.hashSync('password123', 10);
  db.prepare(
    "INSERT INTO users (email, name, password_hash, role) VALUES (?, 'Demo User', ?, 'user')"
  ).run(demoEmail, hash);
}

export default db;

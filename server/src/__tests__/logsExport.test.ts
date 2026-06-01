import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted before imports — factory runs first to build the in-memory DB
vi.mock('../database', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS wellbeing_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      date       TEXT    NOT NULL,
      mood       INTEGER NOT NULL,
      energy     INTEGER NOT NULL,
      focus      INTEGER NOT NULL,
      notes      TEXT,
      work_hours REAL    DEFAULT 8,
      UNIQUE(user_id, date)
    );
  `);
  return { default: db };
});

import db from '../database';
import express from 'express';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
import logsRouter from '../routes/logs';
import { DatabaseSync } from 'node:sqlite';

const testDb = db as unknown as DatabaseSync;
const BOM = '\uFEFF';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/logs', logsRouter);
  return app;
}

function makeToken(overrides: Record<string, unknown> = {}) {
  return jwt.sign(
    { id: 1, email: 'test@example.com', name: 'Test User', role: 'user', teamId: null, ...overrides },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function seedLog(userId: number, date: string, notes: string | null = null) {
  testDb
    .prepare(
      'INSERT OR IGNORE INTO wellbeing_logs (user_id, date, mood, energy, focus, notes, work_hours) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(userId, date, 7, 7, 7, notes, 8);
}

describe('GET /api/logs/export', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM wellbeing_logs');
  });

  it('should return 401 when no auth token is provided', async () => {
    const res = await supertest(makeApp()).get('/api/logs/export');
    expect(res.status).toBe(401);
  });

  it('should return 200 text/csv with correct headers for authenticated ?days=30 request', async () => {
    seedLog(1, '2026-05-10');
    const res = await supertest(makeApp())
      .get('/api/logs/export?days=30')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('wellbeing-logs.csv');
    expect(res.text.charCodeAt(0)).toBe(0xfeff);
    expect(res.text).toContain('date,mood,energy,focus,notes,work_hours,name,email');
  });

  it('should return headers-only CSV when no logs exist in the date range', async () => {
    const res = await supertest(makeApp())
      .get('/api/logs/export?days=7')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const lines = res.text.replace(BOM, '').split('\r\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('date,mood,energy,focus,notes,work_hours,name,email');
  });

  it('should return correct rows for ?start=&end= custom range', async () => {
    seedLog(1, '2026-01-15'); // inside range
    seedLog(1, '2026-03-01'); // outside range

    const res = await supertest(makeApp())
      .get('/api/logs/export?start=2026-01-01&end=2026-02-01')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const lines = res.text.replace(BOM, '').split('\r\n');
    expect(lines).toHaveLength(2); // header + 1 matching row
    expect(lines[1]).toContain('2026-01-15');
  });

  it('should prefer start/end over days when both are present (F-4)', async () => {
    seedLog(1, '2026-01-15'); // in Jan 2026 only
    seedLog(1, '2026-04-01'); // outside Jan 2026

    const res = await supertest(makeApp())
      .get('/api/logs/export?days=365&start=2026-01-01&end=2026-01-31')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    const lines = res.text.replace(BOM, '').split('\r\n');
    expect(lines).toHaveLength(2); // only the Jan row
    expect(lines[1]).toContain('2026-01-15');
  });

  it('should return 400 when start is after end (F-3)', async () => {
    const res = await supertest(makeApp())
      .get('/api/logs/export?start=2026-05-01&end=2026-01-01')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('start date must not be after end date');
  });

  it('should return 400 for an invalid date format', async () => {
    const res = await supertest(makeApp())
      .get('/api/logs/export?start=not-a-date&end=2026-01-01')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });

  it('should return 400 for a semantically invalid date (e.g. month 13) — F-1', async () => {
    const res = await supertest(makeApp())
      .get('/api/logs/export?start=2026-13-45&end=2026-01-31')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid date value');
  });

  it('should only return logs belonging to the authenticated user (F-5/NFR-2)', async () => {
    seedLog(1, '2026-05-01'); // user 1
    seedLog(2, '2026-05-02'); // user 2

    const token2 = makeToken({ id: 2, email: 'user2@test.com', name: 'User Two' });
    const res = await supertest(makeApp())
      .get('/api/logs/export?days=365')
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(200);
    const lines = res.text.replace(BOM, '').split('\r\n');
    expect(lines).toHaveLength(2); // header + user 2's row only
    expect(lines[1]).toContain('2026-05-02');
    expect(lines[1]).not.toContain('2026-05-01');
  });

  it('should include name and email from JWT payload in each row (F-9)', async () => {
    seedLog(1, '2026-05-10');
    const res = await supertest(makeApp())
      .get('/api/logs/export?days=30')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Test User');
    expect(res.text).toContain('test@example.com');
  });
});

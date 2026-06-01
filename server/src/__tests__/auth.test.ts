import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted before imports — factory runs first to build the in-memory DB
vi.mock('../database', async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
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
import authRouter from '../routes/auth';
import { DatabaseSync } from 'node:sqlite';

const testDb = db as unknown as DatabaseSync;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM wellbeing_logs');
    testDb.exec('DELETE FROM users');
    testDb.exec('DELETE FROM teams');
  });

  it('S-1: valid payload returns HTTP 201 with token and user', async () => {
    const res = await supertest(makeApp())
      .post('/api/auth/register')
      .send({ name: 'Alice Smith', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      name: 'Alice Smith',
      email: 'alice@example.com',
      role: 'user',
    });
  });

  it('S-2: duplicate email returns HTTP 409 with correct error message', async () => {
    await supertest(makeApp())
      .post('/api/auth/register')
      .send({ name: 'Alice Smith', email: 'alice@example.com', password: 'password123' });

    const res = await supertest(makeApp())
      .post('/api/auth/register')
      .send({ name: 'Alice Again', email: 'alice@example.com', password: 'password456' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: 'Email already registered' });
  });

  it('S-3: missing required field (no name) returns HTTP 400', async () => {
    const res = await supertest(makeApp())
      .post('/api/auth/register')
      .send({ email: 'noname@example.com', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('S-4: password shorter than 8 characters returns HTTP 400', async () => {
    const res = await supertest(makeApp())
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('S-5: valid payload with teamName creates the team and returns HTTP 201', async () => {
    const res = await supertest(makeApp())
      .post('/api/auth/register')
      .send({
        name: 'Carol Jones',
        email: 'carol@example.com',
        password: 'securepass',
        teamName: 'Engineering',
      });

    expect(res.status).toBe(201);

    const team = testDb
      .prepare('SELECT id FROM teams WHERE name = ?')
      .get('Engineering') as { id: number } | undefined;

    expect(team).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    testDb.exec('DELETE FROM wellbeing_logs');
    testDb.exec('DELETE FROM users');
    testDb.exec('DELETE FROM teams');
  });

  it('S-6: valid credentials return HTTP 200 with token and user', async () => {
    // Register first so a user exists
    await supertest(makeApp())
      .post('/api/auth/register')
      .send({ name: 'Dave Lee', email: 'dave@example.com', password: 'mypassword' });

    const res = await supertest(makeApp())
      .post('/api/auth/login')
      .send({ email: 'dave@example.com', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'dave@example.com' });
  });

  it('S-7: wrong password returns HTTP 401 with Invalid credentials', async () => {
    await supertest(makeApp())
      .post('/api/auth/register')
      .send({ name: 'Eve Brown', email: 'eve@example.com', password: 'correctpass' });

    const res = await supertest(makeApp())
      .post('/api/auth/login')
      .send({ email: 'eve@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'Invalid credentials' });
  });

  it('S-8: unknown email returns HTTP 401', async () => {
    const res = await supertest(makeApp())
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'doesnotmatter' });

    expect(res.status).toBe(401);
  });

  it('S-9: missing fields returns HTTP 400', async () => {
    const res = await supertest(makeApp())
      .post('/api/auth/login')
      .send({ email: 'incomplete@example.com' });

    expect(res.status).toBe(400);
  });
});

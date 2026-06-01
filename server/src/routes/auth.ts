import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database';
import { JWT_SECRET } from '../middleware/auth';

const router = Router();

router.post('/register', (req, res): void => {
  const { email, name, password, role, teamName } = req.body as {
    email: unknown;
    name: unknown;
    password: unknown;
    role?: unknown;
    teamName?: unknown;
  };

  if (
    typeof email !== 'string' ||
    typeof name !== 'string' ||
    typeof password !== 'string'
  ) {
    res.status(400).json({ error: 'Email, name, and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const userRole = role === 'manager' ? 'manager' : 'user';
  const safeEmail = email.toLowerCase().trim().slice(0, 254);
  const safeName = name.trim().slice(0, 100);

  if (!safeEmail || !safeName) {
    res.status(400).json({ error: 'Valid email and name are required' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  try {
    let teamId: number | null = null;
    if (typeof teamName === 'string' && teamName.trim()) {
      const safeTeam = teamName.trim().slice(0, 100);
      const existing = db
        .prepare('SELECT id FROM teams WHERE name = ?')
        .get(safeTeam) as { id: number } | undefined;
      if (existing) {
        teamId = existing.id;
      } else {
        const r = db
          .prepare('INSERT INTO teams (name) VALUES (?)')
          .run(safeTeam);
        teamId = r.lastInsertRowid as number;
      }
    }

    const result = db
      .prepare(
        'INSERT INTO users (email, name, password_hash, role, team_id) VALUES (?,?,?,?,?)'
      )
      .run(safeEmail, safeName, passwordHash, userRole, teamId);

    const user = db
      .prepare('SELECT id, email, name, role, team_id FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as {
      id: number;
      email: string;
      name: string;
      role: string;
      team_id: number | null;
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.team_id,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message?.includes('UNIQUE')) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    throw err;
  }
});

router.post('/login', (req, res): void => {
  const { email, password } = req.body as { email: unknown; password: unknown };

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as
    | {
        id: number;
        email: string;
        name: string;
        password_hash: string;
        role: string;
        team_id: number | null;
      }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.team_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

export default router;

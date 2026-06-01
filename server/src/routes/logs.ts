import { Router, Response } from 'express';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { csvSerialize } from '../utils/csvSerialize';

const router = Router();
router.use(authenticate);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CSV_HEADERS = ['date', 'mood', 'energy', 'focus', 'notes', 'work_hours', 'name', 'email'];

/** Validates both format and calendar correctness (e.g. rejects 2026-13-45). */
function isCalendarDate(s: string): boolean {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// GET /api/logs/export?days=30  OR  ?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/export', (req: AuthRequest, res: Response): void => {
  try {
    const { start, end, days } = req.query;
    let startDate: string;
    let endDate: string;

    // start/end takes precedence over days when both are present (F-4)
    if (start !== undefined || end !== undefined) {
      if (typeof start !== 'string' || !DATE_RE.test(start) ||
          typeof end !== 'string' || !DATE_RE.test(end)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        return;
      }
      if (!isCalendarDate(start) || !isCalendarDate(end)) {
        res.status(400).json({ error: 'Invalid date value.' });
        return;
      }
      if (start > end) {
        res.status(400).json({ error: 'start date must not be after end date' });
        return;
      }
      startDate = start;
      endDate = end;
    } else {
      const daysNum = Math.min(Math.max(parseInt(String(days ?? '30')), 1), 365);
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - daysNum);
      startDate = from.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }

    const rows = db
      .prepare(
        `SELECT date, mood, energy, focus, notes, work_hours
         FROM wellbeing_logs
         WHERE user_id = ? AND date >= ? AND date <= ?
         ORDER BY date DESC
         LIMIT 1000`
      )
      .all(req.user!.id, startDate, endDate) as Record<string, unknown>[];

    // Populate name and email from JWT payload — no DB JOIN required (F-9)
    const exportRows = rows.map((row) => ({
      ...row,
      name: req.user!.name,
      email: req.user!.email,
    }));

    const csv = csvSerialize(exportRows, CSV_HEADERS);

    process.stderr.write(`[export] user=${req.user!.id} rows=${rows.length}\n`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wellbeing-logs.csv"');
    res.send(csv);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[export] error=${message}\n`);
    res.status(500).json({ error: 'Export failed' });
  }
});

// GET /api/logs/today
router.get('/today', (req: AuthRequest, res: Response): void => {
  const today = new Date().toISOString().split('T')[0];
  const log = db
    .prepare('SELECT * FROM wellbeing_logs WHERE user_id = ? AND date = ?')
    .get(req.user!.id, today);
  res.json(log ?? null);
});

// GET /api/logs?days=30
router.get('/', (req: AuthRequest, res: Response): void => {
  const daysNum = Math.min(
    Math.max(parseInt(String(req.query.days ?? '30')), 1),
    365
  );
  const logs = db
    .prepare(
      `SELECT * FROM wellbeing_logs
       WHERE user_id = ? AND date >= date('now', '-' || ? || ' days')
       ORDER BY date DESC`
    )
    .all(req.user!.id, daysNum);
  res.json(logs);
});

// POST /api/logs
router.post('/', (req: AuthRequest, res: Response): void => {
  const { mood, energy, focus, notes, work_hours, date } = req.body as {
    mood: unknown;
    energy: unknown;
    focus: unknown;
    notes?: unknown;
    work_hours?: unknown;
    date?: unknown;
  };

  if (mood === undefined || energy === undefined || focus === undefined) {
    res.status(400).json({ error: 'Mood, energy, and focus are required' });
    return;
  }

  const moodInt = Math.round(Number(mood));
  const energyInt = Math.round(Number(energy));
  const focusInt = Math.round(Number(focus));

  if ([moodInt, energyInt, focusInt].some((v) => isNaN(v) || v < 1 || v > 10)) {
    res.status(400).json({ error: 'Values must be integers between 1 and 10' });
    return;
  }

  const logDate =
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toISOString().split('T')[0];

  const safeNotes =
    typeof notes === 'string' ? notes.slice(0, 1000) : null;
  const workHours =
    work_hours !== undefined
      ? Math.min(Math.max(Number(work_hours), 0), 24)
      : 8;

  db.prepare(
    `INSERT INTO wellbeing_logs (user_id, date, mood, energy, focus, notes, work_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET
       mood       = excluded.mood,
       energy     = excluded.energy,
       focus      = excluded.focus,
       notes      = excluded.notes,
       work_hours = excluded.work_hours`
  ).run(req.user!.id, logDate, moodInt, energyInt, focusInt, safeNotes, workHours);

  const log = db
    .prepare('SELECT * FROM wellbeing_logs WHERE user_id = ? AND date = ?')
    .get(req.user!.id, logDate);

  res.status(201).json(log);
});

export default router;

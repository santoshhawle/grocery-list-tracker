import { Router, Response } from 'express';
import db from '../database';
import { authenticate, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireManager);

// GET /api/team/insights?days=30
router.get('/insights', (req: AuthRequest, res: Response): void => {
  const daysNum = Math.min(
    Math.max(parseInt(String(req.query.days ?? '30')), 1),
    90
  );
  const managerId = req.user!.id;

  // Check team exists
  const managerRow = db
    .prepare('SELECT team_id FROM users WHERE id = ?')
    .get(managerId) as { team_id: number | null } | undefined;

  if (!managerRow?.team_id) {
    res.json({
      overview: { member_count: 0, avg_mood: null, avg_energy: null, avg_focus: null },
      trend: [],
      moodDistribution: [],
      dayPatterns: [],
      message: 'No team assigned. Register or join a team to see insights.',
    });
    return;
  }

  const teamId = managerRow.team_id;

  const overview = db
    .prepare(
      `SELECT
         COUNT(DISTINCT u.id)          AS member_count,
         ROUND(AVG(wl.mood),   1)      AS avg_mood,
         ROUND(AVG(wl.energy), 1)      AS avg_energy,
         ROUND(AVG(wl.focus),  1)      AS avg_focus
       FROM users u
       LEFT JOIN wellbeing_logs wl
         ON u.id = wl.user_id
        AND wl.date >= date('now', '-' || ? || ' days')
       WHERE u.team_id = ? AND u.id != ?`
    )
    .get(daysNum, teamId, managerId);

  const trend = db
    .prepare(
      `SELECT
         wl.date,
         ROUND(AVG(wl.mood),   1) AS avg_mood,
         ROUND(AVG(wl.energy), 1) AS avg_energy,
         ROUND(AVG(wl.focus),  1) AS avg_focus,
         COUNT(*)                  AS entries
       FROM wellbeing_logs wl
       JOIN users u ON wl.user_id = u.id
       WHERE u.team_id = ?
         AND wl.date >= date('now', '-' || ? || ' days')
       GROUP BY wl.date
       ORDER BY wl.date ASC`
    )
    .all(teamId, daysNum);

  const moodDistribution = db
    .prepare(
      `SELECT
         CASE
           WHEN wl.mood <= 3 THEN 'low'
           WHEN wl.mood <= 6 THEN 'medium'
           ELSE 'high'
         END AS mood_level,
         COUNT(*) AS count
       FROM wellbeing_logs wl
       JOIN users u ON wl.user_id = u.id
       WHERE u.team_id = ?
         AND wl.date >= date('now', '-' || ? || ' days')
       GROUP BY mood_level`
    )
    .all(teamId, daysNum);

  const dayPatterns = db
    .prepare(
      `SELECT
         CAST(strftime('%w', wl.date) AS INTEGER) AS day_of_week,
         ROUND(AVG(wl.mood),   1) AS avg_mood,
         ROUND(AVG(wl.energy), 1) AS avg_energy,
         ROUND(AVG(wl.focus),  1) AS avg_focus
       FROM wellbeing_logs wl
       JOIN users u ON wl.user_id = u.id
       WHERE u.team_id = ?
         AND wl.date >= date('now', '-' || ? || ' days')
       GROUP BY day_of_week
       ORDER BY day_of_week`
    )
    .all(teamId, daysNum);

  res.json({ overview, trend, moodDistribution, dayPatterns });
});

export default router;

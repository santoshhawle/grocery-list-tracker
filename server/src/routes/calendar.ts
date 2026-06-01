import { Router, Response } from 'express';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

function defaultSuggestions() {
  return [
    {
      type: 'deep_work',
      title: 'Protect morning hours for deep work',
      description:
        'Most people experience peak cognitive performance in the late morning. Block 9 AM – 12 PM on Mondays and Tuesdays for focused, uninterrupted work.',
      timeBlock: '9:00 AM – 12:00 PM',
      day: 'Monday & Tuesday',
    },
    {
      type: 'meetings',
      title: 'Schedule collaborative meetings mid-week',
      description:
        'Wednesday and Thursday afternoons are typically good for collaborative work and team meetings — energy mid-week after the Monday rush.',
      timeBlock: '1:00 PM – 4:00 PM',
      day: 'Wednesday & Thursday',
    },
    {
      type: 'recovery',
      title: 'Friday: review, plan, and wind down',
      description:
        'Use Friday afternoons for weekly reviews, planning next week, and async communication rather than intensive deep work.',
      timeBlock: '2:00 PM – 5:00 PM',
      day: 'Friday',
    },
  ];
}

// GET /api/calendar/suggestions
router.get('/suggestions', (req: AuthRequest, res: Response): void => {
  const dayPatterns = db
    .prepare(
      `SELECT
         CAST(strftime('%w', date) AS INTEGER) AS day_of_week,
         ROUND(AVG(mood),   1) AS avg_mood,
         ROUND(AVG(energy), 1) AS avg_energy,
         ROUND(AVG(focus),  1) AS avg_focus,
         COUNT(*)               AS data_points
       FROM wellbeing_logs
       WHERE user_id = ? AND date >= date('now', '-60 days')
       GROUP BY day_of_week
       ORDER BY day_of_week`
    )
    .all(req.user!.id) as Array<{
    day_of_week: number;
    avg_mood: number;
    avg_energy: number;
    avg_focus: number;
    data_points: number;
  }>;

  if (dayPatterns.length < 3) {
    res.json({
      message:
        'Log your wellbeing for at least 3 different days to receive personalised meeting time recommendations.',
      suggestions: defaultSuggestions(),
      dayPatterns: [],
    });
    return;
  }

  // Weekdays only, ranked by focus + energy composite
  const weekdays = dayPatterns
    .filter((d) => d.day_of_week >= 1 && d.day_of_week <= 5)
    .sort(
      (a, b) =>
        b.avg_focus + b.avg_energy - (a.avg_focus + a.avg_energy)
    );

  const suggestions = [];

  if (weekdays[0]) {
    const best = weekdays[0];
    suggestions.push({
      type: 'deep_work',
      title: `Best day for deep work: ${DAY_NAMES[best.day_of_week]}`,
      description: `Your focus (${best.avg_focus}/10) and energy (${best.avg_energy}/10) are highest on ${DAY_NAMES[best.day_of_week]}. Block 2-3 hour uninterrupted work sessions and protect this day from unnecessary meetings.`,
      timeBlock: '9:00 AM – 12:00 PM',
      day: DAY_NAMES[best.day_of_week],
    });
  }

  if (weekdays.length >= 2) {
    const mid = weekdays[Math.floor(weekdays.length / 2)];
    suggestions.push({
      type: 'meetings',
      title: `Best day for collaborative meetings: ${DAY_NAMES[mid.day_of_week]}`,
      description: `Schedule team syncs and collaborative sessions on ${DAY_NAMES[mid.day_of_week]} to protect your peak focus days. Your mood on this day averages ${mid.avg_mood}/10.`,
      timeBlock: '10:00 AM – 3:00 PM',
      day: DAY_NAMES[mid.day_of_week],
    });
  }

  if (weekdays.length > 0) {
    const worst = weekdays[weekdays.length - 1];
    suggestions.push({
      type: 'recovery',
      title: `Light schedule day: ${DAY_NAMES[worst.day_of_week]}`,
      description: `Your energy and focus are typically lower on ${DAY_NAMES[worst.day_of_week]}. Schedule administrative tasks, email, or 1:1 catch-ups rather than deep work on this day.`,
      timeBlock: 'Admin tasks & 1:1s',
      day: DAY_NAMES[worst.day_of_week],
    });
  }

  suggestions.push({
    type: 'timing',
    title: 'Buffer between meetings',
    description:
      'Always block 10-15 minutes between consecutive meetings. This recovery time lets you take notes, prepare, and avoid the cognitive cost of abrupt context switching.',
    timeBlock: '10-15 min gaps',
    day: 'Daily',
  });

  res.json({ suggestions, dayPatterns });
});

export default router;

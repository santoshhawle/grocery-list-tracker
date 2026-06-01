import { Router, Response } from 'express';
import db from '../database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

interface Log {
  mood: number;
  energy: number;
  focus: number;
  date: string;
  work_hours: number;
}

type Priority = 'high' | 'medium' | 'low';

interface Suggestion {
  category: string;
  icon: string;
  title: string;
  description: string;
  priority: Priority;
}

const ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function generateSuggestions(logs: Log[]): Suggestion[] {
  if (logs.length === 0) {
    return [
      {
        category: 'onboarding',
        icon: '🌟',
        title: 'Start your wellbeing journey',
        description:
          'Log your mood, energy, and focus today to begin tracking your patterns and receive personalized suggestions.',
        priority: 'high',
      },
    ];
  }

  const suggestions: Suggestion[] = [];
  const latest = logs[0];
  const recent7 = logs.slice(0, 7);

  const avgEnergy =
    recent7.reduce((s, l) => s + l.energy, 0) / recent7.length;
  const avgMood = recent7.reduce((s, l) => s + l.mood, 0) / recent7.length;

  const lowMoodStreak = logs.slice(0, 4).filter((l) => l.mood <= 4).length;
  const longHoursDays = logs.slice(0, 5).filter((l) => l.work_hours > 9).length;

  // --- MOOD ---
  if (lowMoodStreak >= 3) {
    suggestions.push({
      category: 'mental-health',
      icon: '💬',
      title: 'Consider speaking to someone',
      description:
        "Your mood has been low for several days. Talking to a mental health professional, colleague, or trusted friend can help. Check if your company offers an Employee Assistance Programme (EAP).",
      priority: 'high',
    });
  } else if (latest.mood <= 4) {
    suggestions.push({
      category: 'social',
      icon: '☕',
      title: 'Connect with a teammate',
      description:
        'Your mood is low today. Reach out to a colleague for a quick virtual coffee. Social connection — even brief — can significantly lift your spirits.',
      priority: 'high',
    });
  } else if (avgMood < 6) {
    suggestions.push({
      category: 'mindfulness',
      icon: '🧘',
      title: '5-minute mindfulness break',
      description:
        'Try box breathing: inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 cycles to reduce stress hormones and reset your mood.',
      priority: 'medium',
    });
  }

  // --- ENERGY ---
  if (latest.energy <= 3) {
    suggestions.push({
      category: 'exercise',
      icon: '⚡',
      title: 'Immediate energy boost needed',
      description:
        "Your energy is critically low. Stand up, stretch for 5 minutes, drink a large glass of water, and step outside if possible. Avoid caffeine after 2 PM as it disrupts sleep.",
      priority: 'high',
    });
  } else if (latest.energy <= 5) {
    suggestions.push({
      category: 'exercise',
      icon: '🚶',
      title: 'Take a movement break',
      description:
        'A 15-20 minute walk or light exercise boosts energy for 2-3 hours afterward. Step away from your screen now while energy is low, rather than pushing through.',
      priority: 'medium',
    });
  } else if (avgEnergy < 5) {
    suggestions.push({
      category: 'health',
      icon: '😴',
      title: 'Review sleep & nutrition',
      description:
        'Consistently low energy often stems from poor sleep or diet. Aim for 7-9 hours of sleep, eat regular meals, and limit sugary snacks that cause energy crashes.',
      priority: 'medium',
    });
  }

  // --- FOCUS ---
  if (latest.focus <= 3) {
    suggestions.push({
      category: 'productivity',
      icon: '🎯',
      title: 'Use the Pomodoro technique',
      description:
        'Your focus is very low. Set a timer for 25 minutes, work on ONE task only, then take a 5-minute break. After 4 cycles, take a 30-minute break. This retrains sustained attention.',
      priority: 'high',
    });
  } else if (latest.focus <= 5) {
    suggestions.push({
      category: 'environment',
      icon: '🏠',
      title: 'Optimise your environment',
      description:
        'Close unused browser tabs, silence all notifications, and consider playing ambient or lo-fi music. Even 5 minutes tidying your desk can reduce visual distractions.',
      priority: 'medium',
    });
  }

  // --- WORK-LIFE BALANCE ---
  if (longHoursDays >= 3) {
    suggestions.push({
      category: 'balance',
      icon: '⏰',
      title: 'Set a hard stop today',
      description:
        "You've worked over 9 hours on 3+ recent days. Chronic overwork reduces output and raises burnout risk. Block your calendar for a firm end-of-day time and honour it.",
      priority: 'high',
    });
  }

  // --- PEAK STATE ---
  if (latest.mood >= 8 && latest.energy >= 8 && latest.focus >= 7) {
    suggestions.push({
      category: 'productivity',
      icon: '🚀',
      title: "You're in peak state — use it",
      description:
        'All your wellbeing scores are excellent today. This is the ideal time to tackle your most challenging or creative work. Protect this time from unnecessary meetings.',
      priority: 'low',
    });
  }

  // --- HYDRATION (fallback) ---
  if (suggestions.length < 2) {
    suggestions.push({
      category: 'health',
      icon: '💧',
      title: 'Stay hydrated',
      description:
        'Even mild dehydration (1-2%) reduces cognitive performance by up to 20%. Keep a water bottle at your desk and aim for 2 litres per day.',
      priority: 'low',
    });
  }

  return suggestions
    .sort((a, b) => ORDER[a.priority] - ORDER[b.priority])
    .slice(0, 4);
}

// GET /api/suggestions
router.get('/', (req: AuthRequest, res: Response): void => {
  const logs = db
    .prepare(
      `SELECT mood, energy, focus, date, work_hours
       FROM wellbeing_logs
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 14`
    )
    .all(req.user!.id) as unknown as Log[];

  res.json(generateSuggestions(logs));
});

export default router;

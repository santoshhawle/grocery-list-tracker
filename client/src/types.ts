// ─── Domain types ────────────────────────────────────────────────────────────

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'manager';
}

export interface WellbeingLog {
  id: number;
  user_id: number;
  date: string;
  mood: number;
  energy: number;
  focus: number;
  notes: string | null;
  work_hours: number;
  created_at: string;
}

export interface Suggestion {
  category: string;
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TeamTrendPoint {
  date: string;
  avg_mood: number;
  avg_energy: number;
  avg_focus: number;
  entries: number;
}

export interface TeamInsights {
  overview: {
    member_count: number;
    avg_mood: number | null;
    avg_energy: number | null;
    avg_focus: number | null;
  };
  trend: TeamTrendPoint[];
  moodDistribution: Array<{ mood_level: string; count: number }>;
  dayPatterns: Array<{
    day_of_week: number;
    avg_mood: number;
    avg_energy: number;
    avg_focus: number;
  }>;
  message?: string;
}

export interface CalendarSuggestion {
  type: string;
  title: string;
  description: string;
  timeBlock: string;
  day: string;
}

export interface CalendarResponse {
  suggestions: CalendarSuggestion[];
  dayPatterns: Array<{
    day_of_week: number;
    avg_mood: number;
    avg_energy: number;
    avg_focus: number;
    data_points: number;
  }>;
  message?: string;
}

// ─── API payload types ────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateLogData {
  mood: number;
  energy: number;
  focus: number;
  notes?: string;
  work_hours?: number;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: 'user' | 'manager';
  teamName?: string;
}

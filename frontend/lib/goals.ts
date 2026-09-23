import { Application, WeeklyGoalProgress } from './types';

export const GOALS_UPDATED_EVENT = 'jobtracker_goals_updated';
const GOAL_STORAGE_KEY = 'jobtracker_weekly_target';

export function getWeeklyGoalTarget(): number {
  if (typeof window === 'undefined') return 5;
  try {
    const stored = localStorage.getItem(GOAL_STORAGE_KEY);
    return stored ? Math.max(1, parseInt(stored, 10)) : 5;
  } catch {
    return 5;
  }
}

export function setWeeklyGoalTarget(target: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, String(Math.max(1, target)));
    window.dispatchEvent(new CustomEvent(GOALS_UPDATED_EVENT));
  } catch {
    // Ignore localStorage error
  }
}

/**
 * Calculates current week applications count, progress %, and active day streak
 */
export function calculateWeeklyGoalProgress(applications: Application[]): WeeklyGoalProgress {
  const target = getWeeklyGoalTarget();
  const now = new Date();

  // Get Monday of current week (00:00:00)
  const currentDay = now.getDay();
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Filter apps applied this week
  const appliedThisWeek = applications.filter((app) => {
    const applied = new Date(app.applied_date);
    return applied >= monday && applied <= now;
  }).length;

  const progressPercent = Math.min(100, Math.round((appliedThisWeek / target) * 100));

  // Calculate active day streak (consecutive days with at least 1 application applied)
  const appliedDateSet = new Set(
    applications.map((app) => {
      const d = new Date(app.applied_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }),
  );

  let streak = 0;
  let checkDate = new Date(now);

  // Check if today has an application
  const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
  if (!appliedDateSet.has(todayStr)) {
    // If no app today, check if yesterday had one to continue yesterday's streak
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (appliedDateSet.has(dateStr)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    weeklyTarget: target,
    appliedThisWeek,
    progressPercent,
    activeStreakDays: streak,
    isGoalAchieved: appliedThisWeek >= target,
  };
}

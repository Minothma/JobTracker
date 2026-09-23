'use client';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ApplicationTask {
  id: string;
  application_id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  priority: TaskPriority;
  created_at: string;
}

export const TASKS_CHANGED_EVENT = 'jobtracker_tasks_changed';
const TASKS_STORAGE_PREFIX = 'jobtracker_tasks_app_';

/**
 * Common preset task templates for job seekers
 */
export const PRESET_TASK_TEMPLATES: { title: string; priority: TaskPriority; daysOffset?: number }[] = [
  { title: 'Send thank-you email to interviewer within 24h', priority: 'HIGH', daysOffset: 1 },
  { title: 'Review company tech stack, engineering blog, and recent news', priority: 'MEDIUM', daysOffset: 2 },
  { title: 'Prepare 3 thoughtful questions for the hiring manager', priority: 'MEDIUM', daysOffset: 2 },
  { title: 'Practice 5 STAR framework behavioral stories', priority: 'HIGH', daysOffset: 3 },
  { title: 'Send polite follow-up email if no response after 10 days', priority: 'LOW', daysOffset: 10 },
  { title: 'Review compensation package and compare in Matrix', priority: 'HIGH', daysOffset: 2 },
];

/**
 * Get all tasks for an application
 */
export function getApplicationTasks(applicationId: string): ApplicationTask[] {
  if (typeof window === 'undefined' || !applicationId) return [];
  try {
    const raw = localStorage.getItem(`${TASKS_STORAGE_PREFIX}${applicationId}`);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

/**
 * Save tasks for an application
 */
export function saveApplicationTasks(applicationId: string, tasks: ApplicationTask[]): void {
  if (typeof window === 'undefined' || !applicationId) return;
  try {
    localStorage.setItem(`${TASKS_STORAGE_PREFIX}${applicationId}`, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT, { detail: { applicationId } }));
  } catch {
    // Gracefully handle storage quota
  }
}

/**
 * Add a new task to an application
 */
export function addApplicationTask(
  applicationId: string,
  title: string,
  priority: TaskPriority = 'MEDIUM',
  dueDate?: string,
): ApplicationTask {
  const current = getApplicationTasks(applicationId);
  const newTask: ApplicationTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    application_id: applicationId,
    title: title.trim(),
    completed: false,
    due_date: dueDate || undefined,
    priority,
    created_at: new Date().toISOString(),
  };

  const updated = [newTask, ...current];
  saveApplicationTasks(applicationId, updated);
  return newTask;
}

/**
 * Toggle task completion
 */
export function toggleTaskCompletion(applicationId: string, taskId: string): ApplicationTask[] {
  const current = getApplicationTasks(applicationId);
  const updated = current.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
  saveApplicationTasks(applicationId, updated);
  return updated;
}

/**
 * Delete a task
 */
export function deleteApplicationTask(applicationId: string, taskId: string): ApplicationTask[] {
  const current = getApplicationTasks(applicationId);
  const updated = current.filter((t) => t.id !== taskId);
  saveApplicationTasks(applicationId, updated);
  return updated;
}

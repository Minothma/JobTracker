'use client';

const STARRED_STORAGE_KEY = 'jobtracker_starred_applications';
export const STARRED_CHANGED_EVENT = 'jobtracker_starred_changed';

/**
 * Retrieves the set of starred application IDs from localStorage
 */
export function getStarredApplicationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Toggles starred status for an application ID and notifies listeners
 */
export function toggleStarredApplicationId(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = getStarredApplicationIds();
  let isNowStarred = false;

  if (current.has(id)) {
    current.delete(id);
    isNowStarred = false;
  } else {
    current.add(id);
    isNowStarred = true;
  }

  try {
    localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(Array.from(current)));
    window.dispatchEvent(new CustomEvent(STARRED_CHANGED_EVENT, { detail: { id, isStarred: isNowStarred } }));
  } catch (err) {
    console.error('Failed to save starred application', err);
  }

  return isNowStarred;
}

/**
 * Checks if a specific application ID is starred
 */
export function isApplicationStarred(id: string): boolean {
  return getStarredApplicationIds().has(id);
}

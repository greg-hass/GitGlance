import type { SavedRepo } from '../types';

export function parseStoredRepos(raw: string | null): SavedRepo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as SavedRepo[];
    return [];
  } catch {
    return [];
  }
}

export function saveRepos(repos: SavedRepo[]) {
  localStorage.setItem('gitglance_saved', JSON.stringify(repos));
}

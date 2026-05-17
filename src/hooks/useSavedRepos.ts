import { useState, useEffect, useCallback } from 'react';
import type { GithubRepo, SavedRepo } from '../types';
import { parseStoredRepos, saveRepos } from '../lib/storage';

export function useSavedRepos() {
  const [savedRepos, setSavedRepos] = useState<SavedRepo[]>(() => {
    return parseStoredRepos(localStorage.getItem('gitglance_saved'));
  });

  useEffect(() => {
    saveRepos(savedRepos);
  }, [savedRepos]);

  const isSaved = useCallback(
    (repoId: number) => savedRepos.some((r) => r.id === repoId),
    [savedRepos],
  );

  const toggleSave = useCallback((repo: GithubRepo) => {
    setSavedRepos((prev) => {
      const exists = prev.find((r) => r.id === repo.id);
      if (exists) {
        return prev.filter((r) => r.id !== repo.id);
      }
      return [{ ...repo, savedAt: Date.now() }, ...prev];
    });
  }, []);

  return { savedRepos, isSaved, toggleSave };
}

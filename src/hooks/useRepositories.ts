import { useState, useEffect, useCallback } from 'react';
import type { GithubRepo, TabType, TimeRange } from '../types';
import { fetchRepos, GitHubApiError } from '../services/github';

export interface ReposState {
  repos: GithubRepo[];
  isLoading: boolean;
  isFetchingMore: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;
}

export function useRepositories(activeTab: TabType, activeRange: TimeRange) {
  const [state, setState] = useState<ReposState>({
    repos: [],
    isLoading: false,
    isFetchingMore: false,
    page: 1,
    hasMore: true,
    error: null,
  });

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (activeTab === 'saved') return;

      setState((s) => ({
        ...s,
        isLoading: !append,
        isFetchingMore: append,
        error: null,
      }));

      try {
        const { items, hasMore } = await fetchRepos(activeTab as 'trending' | 'latest', activeRange, pageNum);

        setState((s) => ({
          ...s,
          repos: append
            ? [...s.repos, ...items.filter((r) => !s.repos.some((e) => e.id === r.id))]
            : items,
          hasMore,
          isLoading: false,
          isFetchingMore: false,
          page: pageNum,
        }));
      } catch (err) {
        const message =
          err instanceof GitHubApiError && err.status === 403
            ? `GitHub rate limit reached. Try again after ${err.resetAt?.toLocaleTimeString() ?? 'a few minutes'}.`
            : err instanceof Error
              ? err.message
              : 'Failed to load repositories.';

        setState((s) => ({
          ...s,
          error: message,
          isLoading: false,
          isFetchingMore: false,
          hasMore: false,
        }));
      }
    },
    [activeTab, activeRange],
  );

  useEffect(() => {
    setState((s) => ({ ...s, repos: [], page: 1, hasMore: true, error: null }));
    fetchPage(1, false);
  }, [activeTab, activeRange, fetchPage]);

  const loadMore = useCallback(() => {
    if (!state.isLoading && !state.isFetchingMore && state.hasMore && activeTab !== 'saved') {
      fetchPage(state.page + 1, true);
    }
  }, [state, activeTab, fetchPage]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, repos: [], page: 1, hasMore: true, error: null }));
    fetchPage(1, false);
  }, [fetchPage]);

  return { ...state, loadMore, refresh };
}

import type { GithubRepo } from '../types';

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly resetAt?: Date,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

export async function fetchGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    const reset = response.headers.get('x-ratelimit-reset');
    const resetAt = reset ? new Date(Number(reset) * 1000) : undefined;
    const body = await response.json().catch(() => null);
    const message =
      body?.message ||
      (response.status === 403 ? 'GitHub rate limit reached.' : 'GitHub request failed.');

    throw new GitHubApiError(message, response.status, resetAt);
  }

  return response.json() as Promise<T>;
}

export interface FetchReposResult {
  items: GithubRepo[];
  hasMore: boolean;
}

export async function fetchRepos(
  type: 'trending' | 'latest',
  range: 'today' | 'week' | 'month',
  pageNum: number,
): Promise<FetchReposResult> {
  const date = new Date();
  if (range === 'today') date.setDate(date.getDate() - 1);
  else if (range === 'week') date.setDate(date.getDate() - 7);
  else if (range === 'month') date.setMonth(date.getMonth() - 1);

  const formattedDate = date.toISOString().split('T')[0];

  const query =
    type === 'trending'
      ? `created:>${formattedDate} sort:stars-desc`
      : `pushed:>${formattedDate} sort:updated-desc`;

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=30&page=${pageNum}`;

  const data = await fetchGitHubJson<{ items?: GithubRepo[] }>(url);

  const items = data.items ?? [];
  const hasMore = items.length === 30 && pageNum < 34;

  return { items, hasMore };
}

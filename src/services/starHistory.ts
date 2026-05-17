import { fetchGitHubJson } from './github';

export interface StarDataPoint {
  date: string;
  count: number;
}

export interface FetchProgress {
  loaded: number;
  total: number;
  currentPage: number;
  totalPages: number;
}

interface CacheEntry {
  data: StarDataPoint[];
  timestamp: number;
  isPartial: boolean;
}

const CACHE_KEY_PREFIX = 'gg-stars-';
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000;
const MAX_PAGES = 100;
const PER_PAGE = 100;

const getCacheKey = (owner: string, repo: string) =>
  `${CACHE_KEY_PREFIX}${owner}/${repo}`;

const readCache = (owner: string, repo: string): CacheEntry | null => {
  try {
    const raw = localStorage.getItem(getCacheKey(owner, repo));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry;
    if (!Array.isArray(entry.data) || Date.now() - entry.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(getCacheKey(owner, repo));
      return null;
    }

    return entry;
  } catch {
    localStorage.removeItem(getCacheKey(owner, repo));
    return null;
  }
};

const writeCache = (
  owner: string,
  repo: string,
  data: StarDataPoint[],
  isPartial: boolean,
) => {
  const entry: CacheEntry = { data, isPartial, timestamp: Date.now() };
  localStorage.setItem(getCacheKey(owner, repo), JSON.stringify(entry));
};

export function clearCacheForRepo(owner: string, repo: string) {
  localStorage.removeItem(getCacheKey(owner, repo));
}

export async function fetchStarHistory(
  owner: string,
  repo: string,
  onProgress?: (progress: FetchProgress) => void,
): Promise<{ data: StarDataPoint[]; isPartial: boolean }> {
  const cached = readCache(owner, repo);
  if (cached) return { data: cached.data, isPartial: cached.isPartial };

  const repoData = await fetchGitHubJson<{ stargazers_count: number }>(
    `https://api.github.com/repos/${owner}/${repo}`,
  );
  const totalStars = repoData.stargazers_count;
  const totalPages = Math.min(Math.ceil(totalStars / PER_PAGE), MAX_PAGES);
  const isPartial = totalStars > MAX_PAGES * PER_PAGE;
  const allStargazers: Array<{ starred_at?: string }> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const stargazers = await fetchGitHubJson<Array<{ starred_at?: string }>>(
      `https://api.github.com/repos/${owner}/${repo}/stargazers?page=${page}&per_page=${PER_PAGE}`,
      { Accept: 'application/vnd.github.v3.star+json' },
    );

    allStargazers.push(...stargazers);
    onProgress?.({
      loaded: allStargazers.length,
      total: Math.min(totalStars, MAX_PAGES * PER_PAGE),
      currentPage: page,
      totalPages,
    });

    if (stargazers.length < PER_PAGE) break;
  }

  const dateCounts = new Map<string, number>();
  allStargazers.forEach((user) => {
    if (!user.starred_at) return;
    const date = user.starred_at.split('T')[0];
    if (!date) return;
    dateCounts.set(date, (dateCounts.get(date) ?? 0) + 1);
  });

  let cumulative = 0;
  const history = Array.from(dateCounts.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, count]) => {
      cumulative += count;
      return { date, count: cumulative };
    });

  writeCache(owner, repo, history, isPartial);
  return { data: history, isPartial };
}

export interface StarDataPoint {
  date: string;
  count: number;
}

interface CacheEntry {
  data: StarDataPoint[];
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'gg-stars-';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const MAX_PAGES = 100; // 10k stars max
const PER_PAGE = 100;

function getCacheKey(owner: string, repo: string): string {
  return `${CACHE_KEY_PREFIX}${owner}/${repo}`;
}

function getCachedData(owner: string, repo: string): StarDataPoint[] | null {
  const cached = localStorage.getItem(getCacheKey(owner, repo));
  if (!cached) return null;
  
  const entry: CacheEntry = JSON.parse(cached);
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    localStorage.removeItem(getCacheKey(owner, repo));
    return null;
  }
  return entry.data;
}

function setCachedData(owner: string, repo: string, data: StarDataPoint[]): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(getCacheKey(owner, repo), JSON.stringify(entry));
}

export function clearCacheForRepo(owner: string, repo: string): void {
  localStorage.removeItem(getCacheKey(owner, repo));
}

export interface FetchProgress {
  loaded: number;
  total: number;
  currentPage: number;
  totalPages: number;
}

export async function fetchStarHistory(
  owner: string,
  repo: string,
  onProgress?: (progress: FetchProgress) => void
): Promise<{ data: StarDataPoint[]; isPartial: boolean }> {
  // Check cache first
  const cached = getCachedData(owner, repo);
  if (cached) {
    return { data: cached, isPartial: false };
  }

  // Get repo info for total stars
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
    throw new Error(
      repoRes.status === 403 
        ? 'GitHub API rate limit exceeded. Please try again later.' 
        : `Failed to fetch repo: ${repoRes.statusText}`
    );
  }
  const repoData = await repoRes.json();
  const totalStars = repoData.stargazers_count;
  const totalPages = Math.min(Math.ceil(totalStars / PER_PAGE), MAX_PAGES);
  const isPartial = totalStars > MAX_PAGES * PER_PAGE;

  // Fetch all pages
  const allStargazers: Array<{ starred_at: string }> = [];
  
  for (let page = 1; page <= totalPages; page++) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/stargazers?page=${page}&per_page=${PER_PAGE}`,
      { 
        headers: { 
          'Accept': 'application/vnd.github.v3.star+json',
        } 
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to fetch page ${page}: ${response.statusText}`);
    }

    const stargazers = await response.json();
    allStargazers.push(...stargazers);
    
    onProgress?.({
      loaded: allStargazers.length,
      total: Math.min(totalStars, MAX_PAGES * PER_PAGE),
      currentPage: page,
      totalPages,
    });

    if (stargazers.length < PER_PAGE) break; // Last page
  }

  // Aggregate by date
  const dateCounts = new Map<string, number>();
  allStargazers.forEach(user => {
    const date = user.starred_at.split('T')[0];
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
  });

  // Build cumulative history
  const sortedDates = Array.from(dateCounts.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  
  let cumulative = 0;
  const history = sortedDates.map(([date, count]) => {
    cumulative += count;
    return { date, count: cumulative };
  });

  setCachedData(owner, repo, history);
  return { data: history, isPartial };
}

export function clearAllStarHistoryCache(): void {
  Object.keys(localStorage)
    .filter(key => key.startsWith(CACHE_KEY_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}

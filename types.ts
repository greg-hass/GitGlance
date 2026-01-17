
export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  watchers_count: number;
  open_issues_count: number;
  topics: string[];
}

export type TabType = 'trending' | 'latest' | 'saved';

export interface SavedRepo extends GithubRepo {
  savedAt: number;
}

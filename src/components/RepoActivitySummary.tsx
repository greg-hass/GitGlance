import type { GithubRepo } from '../types';
import { TrendingUp } from 'lucide-react';

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
    <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">{label}</span>
    <span className="text-lg font-semibold text-white">{value}</span>
  </div>
);

export const RepoActivitySummary: React.FC<{ repo: GithubRepo }> = ({ repo }) => {
  return (
    <div className="w-full mt-6 mb-10 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <h4 className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 mono">
        <TrendingUp size={14} className="text-indigo-400" />
        Repository Activity
      </h4>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Stars" value={repo.stargazers_count.toLocaleString()} />
        <Metric label="Forks" value={repo.forks_count.toLocaleString()} />
        <Metric label="Watchers" value={repo.watchers_count.toLocaleString()} />
        <Metric label="Open Issues" value={repo.open_issues_count.toLocaleString()} />
      </div>
    </div>
  );
};

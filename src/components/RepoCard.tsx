import { motion } from 'framer-motion';
import { Bookmark, ExternalLink, Star, Clock } from 'lucide-react';
import { getLanguageColor } from '../lib/languageColors';
import { getRelativeTimeString } from '../lib/date';
import type { GithubRepo } from '../types';

export const RepoCard: React.FC<{
  repo: GithubRepo;
  isSaved: boolean;
  onToggleSave: (repo: GithubRepo) => void;
  onClick: (repo: GithubRepo) => void;
}> = ({ repo, isSaved, onToggleSave, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(repo)}
      className="group relative flex flex-col p-6 rounded-2xl border border-white/5 card-gradient cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="w-8 h-8 rounded-full ring-1 ring-white/10"
          />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mono font-medium group-hover:text-indigo-400 transition-colors">{repo.owner.login}</span>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-indigo-400 group-hover:scale-[1.02] transition-all duration-300 origin-left line-clamp-1">{repo.name}</h3>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center p-1 rounded-md text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                title="View on GitHub"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(repo);
          }}
          className={`p-2 rounded-full transition-all duration-300 ${
            isSaved
              ? 'text-indigo-400 bg-indigo-500/10'
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'scale-110' : ''} />
        </button>
      </div>
      <p className="relative z-10 text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2 h-10 group-hover:text-slate-300 transition-colors">
        {repo.description || 'No description provided.'}
      </p>
      {repo.topics && repo.topics.length > 0 && (
        <div className="relative z-10 flex gap-2 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
          {repo.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] font-medium text-slate-500 mono whitespace-nowrap group-hover:text-slate-400 group-hover:border-white/10 transition-colors"
            >
              #{topic}
            </span>
          ))}
        </div>
      )}
      <div className="relative z-10 mt-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {repo.language && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                <span className="text-[11px] font-medium text-slate-400 mono">{repo.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-300 transition-colors">
              <Star size={12} className="text-amber-400/80" />
              <span className="text-[11px] font-medium mono">{repo.stargazers_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-400 transition-colors">
              <Clock size={12} />
              <span className="text-[11px] font-medium mono">{getRelativeTimeString(repo.updated_at)}</span>
            </div>
          </div>
          <div className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all">
            <ExternalLink size={14} />
          </div>
        </div>
      </div>
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
  );
};

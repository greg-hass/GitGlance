import { motion } from 'framer-motion';
import {
  X, Star, GitFork, Eye, Calendar, Clock, ExternalLink, Bookmark,
} from 'lucide-react';
import { formatDate } from '../lib/date';
import { getLanguageColor } from '../lib/languageColors';
import { RepoLanguages } from './RepoLanguages';
import { RepoActivitySummary } from './RepoActivitySummary';
import type { GithubRepo } from '../types';

export const RepoDetailModal: React.FC<{
  repo: GithubRepo;
  isSaved: boolean;
  onToggleSave: (repo: GithubRepo) => void;
  onClose: () => void;
}> = ({ repo, isSaved, onToggleSave, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0D0D0E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto">
          <div className="p-8 md:p-10 border-b border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={repo.owner.avatar_url}
                alt={repo.owner.login}
                className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20 shadow-xl"
              />
              <div className="flex flex-col">
                <span className="text-sm text-indigo-400 mono font-medium">{repo.owner.login}</span>
                <h2 className="text-2xl font-bold text-white tracking-tight">{repo.name}</h2>
              </div>
            </div>

            <p className="text-slate-300 text-lg leading-relaxed mb-8">{repo.description || 'No description provided.'}</p>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-6 bg-white/[0.03] border border-white/5 px-6 py-3 rounded-2xl">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">Stars</span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <Star size={14} className="text-amber-400" />
                    <span>{repo.stargazers_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">Forks</span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <GitFork size={14} className="text-slate-400" />
                    <span>{repo.forks_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">Watchers</span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <Eye size={14} className="text-indigo-400" />
                    <span>{repo.watchers_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => onToggleSave(repo)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 font-medium text-sm ${
                    isSaved
                      ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                      : 'text-white bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save Repo'}
                </button>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
                >
                  <ExternalLink size={16} />
                  Open GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-10 bg-[#0D0D0E]">
            <RepoActivitySummary repo={repo} />
            <RepoLanguages owner={repo.owner.login} name={repo.name} />

            {repo.topics && repo.topics.length > 0 && (
              <div>
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] mb-4">Top Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {repo.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-xs font-medium rounded-lg"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">Created</h4>
                <div className="flex items-center gap-2 text-slate-200">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-sm font-medium">{formatDate(repo.created_at)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">Last Pushed</h4>
                <div className="flex items-center gap-2 text-slate-200">
                  <Clock size={16} className="text-slate-500" />
                  <span className="text-sm font-medium">{formatDate(repo.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {repo.language && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                    <span className="text-sm text-slate-400 font-medium mono">{repo.language}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-600 mono">ID: {repo.id}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

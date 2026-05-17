import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Github, TrendingUp, Sparkles, Bookmark, Search, X, RefreshCw,
} from 'lucide-react';
import type { TabType, TimeRange } from '../types';

export const Header: React.FC<{
  activeTab: TabType;
  activeRange: TimeRange;
  searchQuery: string;
  isLoading: boolean;
  onTabChange: (tab: TabType) => void;
  onRangeChange: (range: TimeRange) => void;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
}> = ({
  activeTab,
  activeRange,
  searchQuery,
  isLoading,
  onTabChange,
  onRangeChange,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navItems = [
    { id: 'trending' as TabType, label: 'Trending', icon: TrendingUp },
    { id: 'latest' as TabType, label: 'Latest', icon: Sparkles },
    { id: 'saved' as TabType, label: 'Saved', icon: Bookmark },
  ];

  const ranges: { id: TimeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <header className="fixed-header glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-2 group cursor-pointer"
            onClick={onRefresh}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Github size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">GitGlance</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={16} />
                  {item.label}
                </div>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={onSearchSubmit} className="relative flex items-center">
            <motion.div
              animate={{
                width: isSearchFocused ? 200 : 140,
                borderColor: 'rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
              className={`relative flex items-center border rounded-xl px-3 py-2 transition-all duration-300 shadow-sm ${
                isSearchFocused ? 'ring-1 ring-indigo-500/20' : ''
              }`}
            >
              <Search size={16} className="text-slate-500 shrink-0" />

              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-100 placeholder:text-slate-600"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </motion.div>
          </form>

          {activeTab !== 'saved' && (
            <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-xl">
              {ranges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => onRangeChange(range.id)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeRange === range.id
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh repositories"
            className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={`${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

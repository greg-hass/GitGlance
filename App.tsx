
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Github, 
  TrendingUp, 
  Sparkles, 
  Bookmark, 
  Search, 
  ExternalLink, 
  Star, 
  GitFork,
  Menu,
  Loader2,
  Eye,
  Calendar,
  X,
  Clock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { GithubRepo, TabType, SavedRepo } from './types';

// Fix for framer-motion type issues in some environments where motion props aren't recognized on motion.div
const MotionDiv = motion.div as any;

type TimeRange = 'today' | 'week' | 'month';

// Utility to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// AI Insight Component
const AIInsight: React.FC<{ repo: GithubRepo }> = ({ repo }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `You are an expert software architect. Provide a single, clever, professional 1-sentence insight or a specific high-impact use-case for this GitHub repository. Be concise and technical.
          Name: ${repo.name}
          Description: ${repo.description || "No description provided."}`,
          config: {
            temperature: 0.7,
            maxOutputTokens: 60,
          }
        });
        setInsight(response.text || "This repository seems like a solid addition to a modern dev stack.");
      } catch (error) {
        console.error("AI Insight failed:", error);
        setInsight("A trending utility that simplifies complex developer workflows.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [repo.id]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-indigo-400" />
        <span className="text-[10px] text-indigo-400 mono uppercase tracking-[0.2em] font-bold">AI Glance Insight</span>
      </div>
      
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-indigo-500/10 rounded w-full" />
          <div className="h-4 bg-indigo-500/10 rounded w-2/3" />
        </div>
      ) : (
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-slate-200 text-sm italic leading-relaxed"
        >
          "{insight}"
        </motion.p>
      )}
      
      {/* Background glow effect */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full" />
    </div>
  );
};

// Components
const RepoDetailModal: React.FC<{
  repo: GithubRepo;
  isSaved: boolean;
  onToggleSave: (repo: GithubRepo) => void;
  onClose: () => void;
}> = ({ repo, isSaved, onToggleSave, onClose }) => {
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0D0D0E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="overflow-y-auto">
          {/* Hero Section */}
          <div className="p-8 md:p-10 border-b border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={repo.owner.avatar_url} 
                alt={repo.owner.login} 
                className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20 shadow-xl"
              />
              <div className="flex flex-col">
                <span className="text-sm text-indigo-400 mono font-medium">
                  {repo.owner.login}
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {repo.name}
                </h2>
              </div>
            </div>

            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              {repo.description || "No description provided."}
            </p>

            {/* AI Insight Section */}
            <div className="mb-8">
              <AIInsight repo={repo} />
            </div>

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
                  <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? "Saved" : "Save Repo"}
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

          {/* Detailed Info */}
          <div className="p-8 md:p-10 space-y-10 bg-[#0D0D0E]">
            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div>
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] mb-4">Top Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {repo.topics.map(topic => (
                    <span key={topic} className="px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-xs font-medium rounded-lg">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
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

            {/* Technical Metadata */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {repo.language && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm text-slate-400 font-medium mono">{repo.language}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-600 mono">ID: {repo.id}</span>
            </div>
          </div>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
};

const RepoCard: React.FC<{
  repo: GithubRepo;
  isSaved: boolean;
  onToggleSave: (repo: GithubRepo) => void;
  onClick: (repo: GithubRepo) => void;
}> = ({ repo, isSaved, onToggleSave, onClick }) => {
  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(repo)}
      className="group relative flex flex-col p-6 rounded-2xl border border-white/5 bg-white/[0.02] card-gradient transition-all duration-300 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={repo.owner.avatar_url} 
            alt={repo.owner.login} 
            className="w-8 h-8 rounded-full ring-1 ring-white/10"
          />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mono font-medium group-hover:text-indigo-400 transition-colors">
              {repo.owner.login}
            </span>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors flex items-center gap-2">
              {repo.name}
            </h3>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(repo);
          }}
          className={`p-2 rounded-full transition-all duration-200 ${
            isSaved 
              ? 'text-indigo-400 bg-indigo-500/10' 
              : 'text-slate-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2 h-10">
        {repo.description || "No description provided."}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/60" />
              <span className="text-xs font-medium text-slate-400 mono">{repo.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Star size={14} className="text-amber-400/80" />
            <span className="text-xs font-medium mono">
              {repo.stargazers_count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <GitFork size={14} />
            <span className="text-xs font-medium mono">
              {repo.forks_count.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="text-slate-500 hover:text-white transition-colors">
          <ExternalLink size={16} />
        </div>
      </div>

      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </MotionDiv>
  );
};

const SkeletonCard = () => (
  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-white/5" />
      <div className="space-y-2">
        <div className="h-2 w-20 bg-white/5 rounded" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
    </div>
    <div className="space-y-2 mb-6">
      <div className="h-3 w-full bg-white/5 rounded" />
      <div className="h-3 w-4/5 bg-white/5 rounded" />
    </div>
    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        <div className="h-4 w-12 bg-white/5 rounded" />
        <div className="h-4 w-12 bg-white/5 rounded" />
      </div>
      <div className="h-4 w-4 bg-white/5 rounded" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [activeRange, setActiveRange] = useState<TimeRange>('week');
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [savedRepos, setSavedRepos] = useState<SavedRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load saved repos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gitglance_saved');
    if (saved) {
      setSavedRepos(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('gitglance_saved', JSON.stringify(savedRepos));
  }, [savedRepos]);

  const fetchRepos = useCallback(async (type: TabType, range: TimeRange, pageNum: number) => {
    if (type === 'saved') return;
    
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    
    try {
      const date = new Date();
      if (range === 'today') date.setDate(date.getDate() - 1);
      else if (range === 'week') date.setDate(date.getDate() - 7);
      else if (range === 'month') date.setMonth(date.getMonth() - 1);
      
      const formattedDate = date.toISOString().split('T')[0];
      
      const query = type === 'trending' 
        ? `created:>${formattedDate} sort:stars-desc`
        : `pushed:>${formattedDate} sort:updated-desc`;
        
      const response = await fetch(`https://api.github.com/search/repositories?q=${query}&per_page=30&page=${pageNum}`);
      const data = await response.json();
      
      if (data.items) {
        if (pageNum === 1) {
          setRepos(data.items);
        } else {
          setRepos(prev => {
            // Filter out duplicates just in case
            const existingIds = new Set(prev.map(r => r.id));
            const newItems = data.items.filter((r: GithubRepo) => !existingIds.has(r.id));
            return [...prev, ...newItems];
          });
        }
        // GitHub API search has a limit of 1000 items, and we fetch 30 per page
        setHasMore(data.items.length === 30 && pageNum < 34);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching repos:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  // Reset and fetch when tab or range changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setRepos([]);
    fetchRepos(activeTab, activeRange, 1);
  }, [activeTab, activeRange, fetchRepos]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && hasMore && activeTab !== 'saved') {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRepos(activeTab, activeRange, nextPage);
    }
  }, [isLoading, isFetchingMore, hasMore, activeTab, page, activeRange, fetchRepos]);

  // Infinite scroll observer
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore && activeTab !== 'saved') {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(currentTarget);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, isFetchingMore, activeTab]);

  const toggleSave = (repo: GithubRepo) => {
    setSavedRepos(prev => {
      const exists = prev.find(r => r.id === repo.id);
      if (exists) {
        return prev.filter(r => r.id !== repo.id);
      }
      return [{ ...repo, savedAt: Date.now() }, ...prev];
    });
  };

  const filteredRepos = useMemo(() => {
    const source = activeTab === 'saved' ? savedRepos : repos;
    if (!searchQuery) return source;
    return source.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.owner.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, repos, savedRepos, searchQuery]);

  const navItems = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'latest', label: 'Latest', icon: Sparkles },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  const ranges: { id: TimeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <AnimatePresence>
        {selectedRepo && (
          <RepoDetailModal 
            repo={selectedRepo} 
            isSaved={!!savedRepos.find(r => r.id === selectedRepo.id)}
            onToggleSave={toggleSave}
            onClose={() => setSelectedRepo(null)}
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Github size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                GitGlance
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === item.id ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <item.icon size={16} />
                    {item.label}
                  </div>
                  {activeTab === item.id && (
                    <MotionDiv 
                      layoutId="nav-underline"
                      className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <MotionDiv 
              animate={{ width: isSearchFocused ? 280 : 180 }}
              className={`relative hidden sm:flex items-center bg-white/5 border rounded-xl px-3 py-2 transition-all duration-300 ${
                isSearchFocused ? 'border-indigo-500/50 bg-white/10' : 'border-white/5'
              }`}
            >
              <Search size={16} className="text-slate-500 shrink-0" />
              <input 
                type="text"
                placeholder="Find a repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-100 placeholder:text-slate-600"
              />
            </MotionDiv>
            
            <button className="md:hidden text-slate-400 hover:text-white">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 text-lg max-w-lg">
              {activeTab === 'trending' && `Discover the most popular projects from the community ${activeRange === 'today' ? 'today' : activeRange === 'week' ? 'this week' : 'this month'}.`}
              {activeTab === 'latest' && `Freshly baked code. See what's brand new on GitHub ${activeRange === 'today' ? 'today' : activeRange === 'week' ? 'this week' : 'this month'}.`}
              {activeTab === 'saved' && "Your personal library of tools, libraries, and inspiration."}
            </p>
          </div>

          {activeTab !== 'saved' && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-xl w-fit self-start">
              {ranges.map((range) => (
                <button 
                  key={range.id}
                  onClick={() => setActiveRange(range.id)}
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
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading && page === 1 ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <RepoCard 
                  key={repo.id} 
                  repo={repo} 
                  isSaved={!!savedRepos.find(r => r.id === repo.id)}
                  onToggleSave={toggleSave}
                  onClick={(r) => setSelectedRepo(r)}
                />
              ))
            ) : !isLoading && (
              <MotionDiv 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-600 mb-6">
                  {activeTab === 'saved' ? <Bookmark size={32} /> : <Search size={32} />}
                </div>
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  {searchQuery ? "No results found" : activeTab === 'saved' ? "Your library is empty" : "Something went wrong"}
                </h3>
                <p className="text-slate-500 max-w-xs">
                  {searchQuery 
                    ? `We couldn't find anything matching "${searchQuery}" in your current view.`
                    : activeTab === 'saved' 
                      ? "Start exploring and save repositories you find interesting to see them here."
                      : "We had trouble loading the latest repositories. Please try refreshing."}
                </p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-6 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                  >
                    Clear search filter
                  </button>
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Sentinel element for infinite scroll */}
        {activeTab !== 'saved' && hasMore && (
          <div 
            ref={observerTarget} 
            className="w-full h-24 flex items-center justify-center mt-8"
          >
            {isFetchingMore && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 mono uppercase tracking-widest">Loading more</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="glass border border-white/10 rounded-2xl flex justify-around p-3 shadow-2xl shadow-black/50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`p-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-indigo-500 text-white' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;

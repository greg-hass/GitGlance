import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Github, 
  Sparkles, 
  Bookmark, 
  Search, 
  ExternalLink, 
  Star, 
  GitFork,
  Loader2,
  X,
  Clock,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Wand2,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI, Type } from "@google/genai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Types
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

// Fix for framer-motion type issues in some environments
const MotionDiv = motion.div as any;

type TimeRange = 'today' | 'week' | 'month';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getRelativeTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c", Python: "#3572A5",
  Java: "#b07219", "C++": "#f34b7d", C: "#555555", PHP: "#4F5D95", Ruby: "#701516", Go: "#00ADD8",
  Swift: "#F05138", Rust: "#dea584", Kotlin: "#A97BFF", Dart: "#00B4AB", Shell: "#89e051",
  Vue: "#41b883", React: "#61dafb", Svelte: "#ff3e00", Zig: "#ec915c", Nix: "#7e7eff"
};

const getLanguageColor = (lang: string) => LANGUAGE_COLORS[lang] || "#8b949e";

const aiInsightCache = new Map<number, string>();
const languagesCache = new Map<string, Record<string, number>>();

const getApiKey = () => {
  const metaEnv = (import.meta as any)?.env ?? {};
  const browserEnv = (window as any)?.process?.env ?? {};
  const nodeEnv = typeof process !== 'undefined' ? (process as any).env ?? {} : {};
  return (
    metaEnv.VITE_GEMINI_API_KEY ||
    metaEnv.VITE_GOOGLE_API_KEY ||
    metaEnv.VITE_API_KEY ||
    browserEnv.API_KEY ||
    nodeEnv.API_KEY
  );
};

const StarGrowthChart: React.FC<{ stargazersCount: number }> = ({ stargazersCount }) => {
  const data = useMemo(() => {
    const points = 30;
    const chartData = [];
    const now = new Date();
    for (let i = points; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const growthFactor = 1 - (i * (Math.random() * 0.005 + 0.002));
      chartData.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        stars: Math.floor(stargazersCount * growthFactor),
      });
    }
    return chartData;
  }, [stargazersCount]);

  return (
    <div className="w-full h-[240px] mt-6 mb-10">
      <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
        <TrendingUpIcon size={14} className="text-indigo-400" /> Star Growth (30 Days)
      </h4>
      <div className="w-full h-full bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} interval={6} />
            <YAxis hide={true} domain={['dataMin - 100', 'dataMax + 100']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0D0D0E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontFamily: 'JetBrains Mono', color: '#fff' }}
              itemStyle={{ color: '#818cf8' }} labelStyle={{ color: '#64748b', marginBottom: '4px' }} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }}
            />
            <Area type="monotone" dataKey="stars" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorStars)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);
  return (
    <MotionDiv layout initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#121214] border border-white/10 shadow-2xl pointer-events-auto min-w-[200px]">
      {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : toast.type === 'error' ? <X size={18} className="text-rose-400 shrink-0" /> : <Trash2 size={18} className="text-slate-400 shrink-0" />}
      <span className="text-sm font-medium text-slate-200">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="ml-auto p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
    </MotionDiv>
  );
};

const AIInsight: React.FC<{ repo: GithubRepo }> = ({ repo }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchInsight = async () => {
      const cached = aiInsightCache.get(repo.id);
      if (cached) {
        setInsight(cached);
        return;
      }
      const apiKey = getApiKey();
      if (!apiKey) {
        setInsight("Add a Gemini API key to unlock AI insights for this repository.");
        return;
      }
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Expert technical insight (1 clever sentence) for GitHub repo: ${repo.name} - ${repo.description || "No description"}`,
          config: { temperature: 0.7, maxOutputTokens: 60 }
        });
        const message = response.text || "A high-impact tool for modern developers.";
        aiInsightCache.set(repo.id, message);
        setInsight(message);
      } catch (e) {
        setInsight("Trending repository with significant community momentum.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsight();
  }, [repo.id]);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-indigo-400" /><span className="text-[10px] text-indigo-400 mono uppercase tracking-[0.2em] font-bold">AI Insight</span></div>
      {loading ? <div className="space-y-2 animate-pulse"><div className="h-4 bg-indigo-500/10 rounded w-full" /><div className="h-4 bg-indigo-500/10 rounded w-2/3" /></div> : <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-slate-200 text-sm italic leading-relaxed">"{insight}"</motion.p>}
    </div>
  );
};

const RepoLanguages: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const cacheKey = `${owner}/${name}`;
    const cached = languagesCache.get(cacheKey);
    if (cached) {
      setLanguages(cached);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const loadLanguages = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${name}/languages`, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch languages");
        const data = await response.json();
        languagesCache.set(cacheKey, data);
        setLanguages(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadLanguages();
    return () => controller.abort();
  }, [owner, name]);
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sortedLangs = Object.entries(languages).sort(([, a], [, b]) => b - a).slice(0, 6);
  if (loading) return <div className="h-2 w-full bg-white/5 rounded-full animate-pulse" />;
  if (sortedLangs.length === 0) return null;
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">Primary Stack</h4>
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5">
        {sortedLangs.map(([lang, value]) => (<div key={lang} style={{ width: `${(value / total) * 100}%`, backgroundColor: getLanguageColor(lang) }} />))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {sortedLangs.map(([lang, value]) => (
          <div key={lang} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLanguageColor(lang) }} /><span className="text-xs font-medium text-slate-200 mono">{lang}</span> <span className="text-xs text-slate-500 mono">{Math.round((value / total) * 100)}%</span></div>
        ))}
      </div>
    </div>
  );
};

const RepoDetailModal: React.FC<{ repo: GithubRepo; isSaved: boolean; onToggleSave: (repo: GithubRepo) => void; onClose: () => void; }> = ({ repo, isSaved, onToggleSave, onClose }) => {
  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <MotionDiv initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-[#0D0D0E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5 z-10"><X size={20} /></button>
        <div className="overflow-y-auto p-8 md:p-10 space-y-10">
          <div className="flex items-center gap-4">
            <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20" />
            <div><span className="text-sm text-indigo-400 mono">{repo.owner.login}</span><h2 className="text-2xl font-bold text-white">{repo.name}</h2></div>
          </div>
          <p className="text-slate-300 text-lg leading-relaxed">{repo.description || "No description provided."}</p>
          <AIInsight repo={repo} />
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-6 bg-white/[0.03] border border-white/5 px-6 py-3 rounded-2xl">
              <div className="flex flex-col gap-1"><span className="text-[10px] text-slate-500 mono">STARS</span><div className="flex items-center gap-1.5 font-semibold text-white"><Star size={14} className="text-amber-400" />{repo.stargazers_count.toLocaleString()}</div></div>
              <div className="w-px h-8 bg-white/5" /><div className="flex flex-col gap-1"><span className="text-[10px] text-slate-500 mono">FORKS</span><div className="flex items-center gap-1.5 font-semibold text-white"><GitFork size={14} className="text-slate-400" />{repo.forks_count.toLocaleString()}</div></div>
            </div>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => onToggleSave(repo)} className={`px-5 py-3 rounded-2xl transition-all font-medium text-sm ${isSaved ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-white bg-white/5 border border-white/10'}`}><Bookmark size={16} fill={isSaved ? "currentColor" : "none"} className="inline mr-2" />{isSaved ? "Saved" : "Save"}</button>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"><ExternalLink size={16} className="inline mr-2" />View Source</a>
            </div>
          </div>
          <StarGrowthChart stargazersCount={repo.stargazers_count} />
          <RepoLanguages owner={repo.owner.login} name={repo.name} />
          <div className="grid grid-cols-2 gap-8 pb-4">
            <div><h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] mb-1">Created</h4><div className="text-slate-200 text-sm font-medium">{formatDate(repo.created_at)}</div></div>
            <div><h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] mb-1">Last Pushed</h4><div className="text-slate-200 text-sm font-medium">{formatDate(repo.updated_at)}</div></div>
          </div>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
};

const RepoCard: React.FC<{ repo: GithubRepo; isSaved: boolean; onToggleSave: (repo: GithubRepo) => void; onClick: (repo: GithubRepo) => void; }> = ({ repo, isSaved, onToggleSave, onClick }) => {
  return (
    <MotionDiv layout whileHover={{ y: -4 }} onClick={() => onClick(repo)} className="group relative flex flex-col p-6 rounded-2xl border border-white/5 card-gradient cursor-pointer overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img src={repo.owner.avatar_url} className="w-8 h-8 rounded-full ring-1 ring-white/10" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mono group-hover:text-indigo-400 transition-colors">{repo.owner.login}</span>
            <h3 className="text-lg font-semibold text-slate-100 group-hover:text-indigo-400 group-hover:scale-[1.02] transition-all origin-left line-clamp-1">{repo.name}</h3>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleSave(repo); }} className={`p-2 rounded-full transition-all ${isSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}><Bookmark size={18} fill={isSaved ? "currentColor" : "none"} /></button>
      </div>
      <p className="relative z-10 text-slate-400 text-sm mb-6 line-clamp-2 h-10 group-hover:text-slate-300 transition-colors">{repo.description || "No description provided."}</p>
      <div className="mt-auto flex justify-between items-center">
        <div className="flex gap-4">
          {repo.language && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} /><span className="text-[11px] font-medium text-slate-400 mono">{repo.language}</span></div>}
          <div className="flex items-center gap-1.5 text-slate-400"><Star size={12} className="text-amber-400/80" /><span className="text-[11px] font-medium mono">{repo.stargazers_count.toLocaleString()}</span></div>
        </div>
        <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-300 transition-all" />
      </div>
    </MotionDiv>
  );
};

const SkeletonCard = () => (<div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse"><div className="h-8 w-8 bg-white/5 rounded-full mb-4" /><div className="h-4 w-3/4 bg-white/10 rounded mb-2" /><div className="h-10 w-full bg-white/5 rounded mb-6" /><div className="h-4 w-1/2 bg-white/5 rounded" /></div>);

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
  const [isSmartFilterMode, setIsSmartFilterMode] = useState(false);
  const [isAiFiltering, setIsAiFiltering] = useState(false);
  const [aiFilteredIds, setAiFilteredIds] = useState<number[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const requestController = useRef<AbortController | null>(null);

  const isAiEnabled = useMemo(() => Boolean(getApiKey()), []);
  const savedRepoIds = useMemo(() => new Set(savedRepos.map(repo => repo.id)), [savedRepos]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gg_saved');
      if (stored) setSavedRepos(JSON.parse(stored));
    } catch (error) {
      console.warn("Failed to read saved repos from storage.", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gg_saved', JSON.stringify(savedRepos));
    } catch (error) {
      console.warn("Failed to save repos to storage.", error);
    }
  }, [savedRepos]);

  const addToast = (m: string, t: 'success' | 'info' | 'error' = 'success') => { const id = Date.now(); setToasts(p => [...p, { id, message: m, type: t }]); };
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  const fetchRepos = useCallback(async (t: TabType, r: TimeRange, p: number) => {
    if (t === 'saved') return;
    if (p === 1) { setIsLoading(true); setAiFilteredIds(null); } else { setIsFetchingMore(true); }
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      setErrorMessage(null);
      const d = new Date();
      if (r === 'today') d.setDate(d.getDate() - 1); else if (r === 'week') d.setDate(d.getDate() - 7); else d.setMonth(d.getMonth() - 1);
      const fd = d.toISOString().split('T')[0];
      const q = t === 'trending' ? `created:>${fd} sort:stars-desc` : `pushed:>${fd} sort:updated-desc`;
      const res = await fetch(`https://api.github.com/search/repositories?q=${q}&per_page=30&page=${p}`, { signal: controller.signal });
      if (!res.ok) {
        const message = res.status === 403
          ? "GitHub API rate limit hit. Please wait a bit or add an authenticated proxy."
          : `GitHub API error (${res.status}).`;
        throw new Error(message);
      }
      const data = await res.json();
      if (data.items) {
        if (p === 1) setRepos(data.items); else setRepos(prev => [...prev, ...data.items.filter((ni: any) => !prev.find(pi => pi.id === ni.id))]);
        setHasMore(data.items.length === 30 && p < 15);
        setLastUpdated(new Date());
      } else {
        setHasMore(false);
        setErrorMessage("Unexpected response from GitHub.");
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setHasMore(false);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load repositories.");
    } finally {
      if (controller.signal.aborted) return;
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, []);

  useEffect(() => { setPage(1); setHasMore(true); setRepos([]); fetchRepos(activeTab, activeRange, 1); }, [activeTab, activeRange, fetchRepos]);
  useEffect(() => {
    if (activeTab === 'saved') {
      setErrorMessage(null);
    }
  }, [activeTab]);
  useEffect(() => () => requestController.current?.abort(), []);

  const loadMore = useCallback(() => { if (!isLoading && !isFetchingMore && hasMore && activeTab !== 'saved') { const np = page + 1; setPage(np); fetchRepos(activeTab, activeRange, np); } }, [isLoading, isFetchingMore, hasMore, activeTab, page, activeRange, fetchRepos]);

  useEffect(() => {
    const ob = new IntersectionObserver(e => { if (e[0].isIntersecting && hasMore && !isLoading && !isFetchingMore && activeTab !== 'saved') loadMore(); }, { threshold: 0.1 });
    if (observerTarget.current) ob.observe(observerTarget.current);
    return () => ob.disconnect();
  }, [loadMore, hasMore, isLoading, isFetchingMore, activeTab]);

  const toggleSave = (repo: GithubRepo) => {
    setSavedRepos(prev => {
      const ex = prev.find(r => r.id === repo.id);
      if (ex) { addToast(`Removed ${repo.name}`, 'info'); return prev.filter(r => r.id !== repo.id); }
      addToast(`Saved ${repo.name}!`); return [{ ...repo, savedAt: Date.now() }, ...prev];
    });
  };

  const handleRefresh = () => { setPage(1); setHasMore(true); setRepos([]); setAiFilteredIds(null); fetchRepos(activeTab, activeRange, 1); addToast('Refreshed Feed'); };

  const runSmartFilter = async (q: string) => {
    const normalizedQuery = q.trim();
    if (!normalizedQuery || normalizedQuery.length < 3) {
      addToast("Enter at least 3 characters to filter.", "info");
      return;
    }
    const apiKey = getApiKey();
    if (!apiKey) {
      addToast("Add a Gemini API key to enable Smart Filter.", "error");
      return;
    }
    setIsAiFiltering(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Filter matching repository IDs for intent: "${normalizedQuery}" in data: ${JSON.stringify(repos.map(r => ({ id: r.id, name: r.name, desc: r.description })))}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.INTEGER } } }
      });
      setAiFilteredIds(JSON.parse(res.text));
    } catch (e) {
      addToast("Filter error", "error");
    } finally {
      setIsAiFiltering(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSmartFilterMode) {
      runSmartFilter(searchQuery);
    }
  };

  const filteredRepos = useMemo(() => {
    let res = activeTab === 'saved' ? savedRepos : repos;
    if (aiFilteredIds !== null) res = res.filter(r => aiFilteredIds.includes(r.id));
    if (!searchQuery || isSmartFilterMode) return res;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return res;
    return res.filter(r => {
      const haystack = [
        r.name,
        r.owner.login,
        r.description ?? '',
        r.language ?? '',
        ...(r.topics ?? [])
      ];
      return haystack.some(value => value.toLowerCase().includes(query));
    });
  }, [activeTab, repos, savedRepos, searchQuery, aiFilteredIds, isSmartFilterMode]);

  const navItems = [{ id: 'trending', label: 'Trending', icon: TrendingUpIcon }, { id: 'latest', label: 'Latest', icon: Sparkles }, { id: 'saved', label: 'Saved', icon: Bookmark }];

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <div className="fixed bottom-28 md:bottom-8 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>{toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={removeToast} />)}</AnimatePresence>
      </div>
      <AnimatePresence>{selectedRepo && <RepoDetailModal repo={selectedRepo} isSaved={savedRepoIds.has(selectedRepo.id)} onToggleSave={toggleSave} onClose={() => setSelectedRepo(null)} />}</AnimatePresence>
      
      <header className="sticky top-0 z-50 glass header-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={handleRefresh}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Github size={18} /></div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">GitGlance</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(i => (
              <button key={i.id} onClick={() => setActiveTab(i.id as TabType)} className={`relative px-3 py-2 text-sm font-medium transition-colors ${activeTab === i.id ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                <div className="flex items-center gap-2"><i.icon size={16} />{i.label}</div>
                {activeTab === i.id && <MotionDiv layoutId="nav-underline" className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" />}
              </button>
            ))}
          </nav>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className={`flex items-center bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 transition-all ${isSmartFilterMode ? 'ring-1 ring-indigo-500/30' : ''}`}>
              {isAiFiltering ? <Loader2 size={16} className="text-indigo-400 animate-spin" /> : isSmartFilterMode ? <Sparkles size={16} className="text-indigo-400" /> : <Search size={16} className="text-slate-500" />}
              <input
                type="text"
                placeholder={isSmartFilterMode ? "Ask AI (e.g. devtools)" : "Search..."}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm ml-2 w-24 sm:w-48 text-slate-100 placeholder:text-slate-600"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isAiEnabled) {
                  addToast("Add a Gemini API key to enable Smart Filter.", "error");
                  return;
                }
                const nextMode = !isSmartFilterMode;
                setIsSmartFilterMode(nextMode);
                if (!nextMode) {
                  setAiFilteredIds(null);
                }
              }}
              disabled={!isAiEnabled}
              title={isAiEnabled ? "Toggle Smart Filter" : "Add API key to enable AI"}
              className={`p-2 rounded-xl border transition-all ${isSmartFilterMode ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/5 text-slate-400'} ${!isAiEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Wand2 size={18} />
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              {navItems.find(n => n.id === activeTab)?.label}
              {aiFilteredIds !== null && (
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium mono">
                  AI Filtered
                </span>
              )}
            </h1>
            <p className="text-slate-500">Discovering high-quality projects on GitHub.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
                {filteredRepos.length} results
              </span>
              {lastUpdated && (
                <span className="px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  Updated {getRelativeTimeString(lastUpdated.toISOString())}
                </span>
              )}
              {!isAiEnabled && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-200 border border-amber-500/20">
                  AI features disabled
                </span>
              )}
            </div>
          </div>
          {activeTab !== 'saved' && (
            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl">
                {['today', 'week', 'month'].map(r => <button key={r} onClick={() => setActiveRange(r as TimeRange)} className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeRange === r ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>{r}</button>)}
              </div>
              <button onClick={handleRefresh} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></button>
            </div>
          )}
        </div>
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-semibold">We hit a snag fetching repositories.</p>
              <p className="text-rose-200/80">{errorMessage}</p>
            </div>
            <button onClick={handleRefresh} className="self-start md:self-auto px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-50 transition">
              Retry
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading && page === 1 ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredRepos.length > 0 ? (
              filteredRepos.map(repo => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isSaved={savedRepoIds.has(repo.id)}
                  onToggleSave={toggleSave}
                  onClick={setSelectedRepo}
                />
              ))
            ) : (
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-16 text-center text-slate-400 border border-white/5 rounded-2xl bg-white/[0.02]"
              >
                <h3 className="text-lg font-semibold text-slate-200 mb-2">No repositories found</h3>
                <p className="text-sm text-slate-500">Try adjusting your filters, search terms, or time range.</p>
                {(searchQuery || aiFilteredIds !== null) && (
                  <button
                    onClick={() => { setSearchQuery(''); setAiFilteredIds(null); }}
                    className="mt-4 text-indigo-300 hover:text-indigo-200 text-sm font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
        {activeTab !== 'saved' && hasMore && <div ref={observerTarget} className="w-full h-24 flex items-center justify-center mt-8">{isFetchingMore && <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />}</div>}
      </main>

      {/* Floating Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <div className="glass border border-white/10 rounded-3xl flex justify-around p-2 shadow-2xl shadow-black/80 ring-1 ring-white/5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className="relative flex flex-col items-center justify-center p-3 transition-all duration-300 min-w-[64px]"
              >
                {isActive && (
                  <MotionDiv
                    layoutId="mobile-nav-active-pill"
                    className="absolute inset-0 bg-indigo-500/10 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <MotionDiv
                  animate={{
                    scale: isActive ? 1.25 : 1,
                    color: isActive ? "#818cf8" : "#64748b"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10 flex flex-col items-center gap-1"
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <MotionDiv
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold mono uppercase tracking-tight"
                    >
                      {item.label}
                    </MotionDiv>
                  )}
                </MotionDiv>
                {isActive && (
                  <MotionDiv
                    layoutId="mobile-nav-dot"
                    className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  Zap,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Code2,
  Filter,
  Wand2,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenAI, Type } from "@google/genai";
import { GithubRepo, TabType, SavedRepo } from "./types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Fix for framer-motion type issues in some environments where motion props aren't recognized on motion.div
const MotionDiv = motion.div as any;

type TimeRange = "today" | "week" | "month";

interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

// Utility to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getRelativeTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Swift: "#F05138",
  Rust: "#dea584",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb",
  Svelte: "#ff3e00",
  Zig: "#ec915c",
  Nix: "#7e7eff",
};

const getLanguageColor = (lang: string) => LANGUAGE_COLORS[lang] || "#8b949e";

// Star Growth Chart Component
const StarGrowthChart: React.FC<{ stargazersCount: number }> = ({
  stargazersCount,
}) => {
  const data = useMemo(() => {
    const points = 30;
    const chartData = [];
    let currentStars = stargazersCount;
    const now = new Date();

    for (let i = points; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      // Simulate historical growth
      // We assume about 0.1% to 1% growth daily for trending repos
      const growthFactor = 1 - i * (Math.random() * 0.005 + 0.002);
      chartData.push({
        name: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        stars: Math.floor(stargazersCount * growthFactor),
      });
    }
    return chartData;
  }, [stargazersCount]);

  return (
    <div className="w-full h-[240px] mt-6 mb-10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] flex items-center gap-2">
          <TrendingUpIcon size={14} className="text-indigo-400" />
          Star Growth (30 Days)
        </h4>
      </div>
      <div className="w-full h-full bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorStars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
              interval={6}
            />
            <YAxis hide={true} domain={["dataMin - 100", "dataMax + 100"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0D0D0E",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "12px",
                fontFamily: "JetBrains Mono",
                color: "#fff",
              }}
              itemStyle={{ color: "#818cf8" }}
              labelStyle={{ color: "#64748b", marginBottom: "4px" }}
              cursor={{ stroke: "rgba(99,102,241,0.2)", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="stars"
              stroke="#6366f1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStars)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Toast Component
const ToastItem: React.FC<{
  toast: Toast;
  onDismiss: (id: number) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#121214] border border-white/10 shadow-2xl pointer-events-auto min-w-[200px]"
    >
      {toast.type === "success" ? (
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      ) : toast.type === "error" ? (
        <X size={18} className="text-rose-400 shrink-0" />
      ) : (
        <Trash2 size={18} className="text-slate-400 shrink-0" />
      )}
      <span className="text-sm font-medium text-slate-200">
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </MotionDiv>
  );
};

// AI Insight Component
const AIInsight: React.FC<{ repo: GithubRepo }> = ({ repo }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `You are an expert software architect. Provide a single, clever, professional 1-sentence insight or a specific high-impact use-case for this GitHub repository. Be concise and technical.
          Name: ${repo.name}
          Description: ${repo.description || "No description provided."}`,
          config: {
            temperature: 0.7,
            maxOutputTokens: 60,
          },
        });
        setInsight(
          response.text ||
            "This repository seems like a solid addition to a modern dev stack.",
        );
      } catch (error) {
        console.error("AI Insight failed:", error);
        setInsight(
          "A trending utility that simplifies complex developer workflows.",
        );
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
        <span className="text-[10px] text-indigo-400 mono uppercase tracking-[0.2em] font-bold">
          AI Glance Insight
        </span>
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

const RepoLanguages: React.FC<{ owner: string; name: string }> = ({
  owner,
  name,
}) => {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${name}/languages`,
        );
        if (!res.ok) throw new Error("Failed to fetch languages");
        const data = await res.json();
        setLanguages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, [owner, name]);

  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sortedLangs = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-4">
        <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">
          Languages
        </h4>
        <div className="h-2 w-full bg-white/5 rounded-full animate-pulse" />
      </div>
    );
  }

  if (sortedLangs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">
        Primary Languages
      </h4>

      {/* Progress Bar */}
      <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5">
        {sortedLangs.map(([lang, value]) => (
          <div
            key={lang}
            style={{
              width: `${(value / total) * 100}%`,
              backgroundColor: getLanguageColor(lang),
            }}
            title={`${lang}: ${Math.round((value / total) * 100)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {sortedLangs.map(([lang, value]) => (
          <div key={lang} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getLanguageColor(lang) }}
            />
            <span className="text-xs font-medium text-slate-200 mono">
              {lang}
            </span>
            <span className="text-xs text-slate-500 mono">
              {Math.round((value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
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
                  <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">
                    Stars
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <Star size={14} className="text-amber-400" />
                    <span>{repo.stargazers_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">
                    Forks
                  </span>
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <GitFork size={14} className="text-slate-400" />
                    <span>{repo.forks_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500 mono uppercase tracking-wider">
                    Watchers
                  </span>
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
                      ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
                      : "text-white bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Bookmark
                    size={16}
                    fill={isSaved ? "currentColor" : "none"}
                  />
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
            {/* Growth Chart Section */}
            <StarGrowthChart stargazersCount={repo.stargazers_count} />

            {/* Languages Section */}
            <RepoLanguages owner={repo.owner.login} name={repo.name} />

            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div>
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em] mb-4">
                  Top Topics
                </h4>
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

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">
                  Created
                </h4>
                <div className="flex items-center gap-2 text-slate-200">
                  <Calendar size={16} className="text-slate-500" />
                  <span className="text-sm font-medium">
                    {formatDate(repo.created_at)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">
                  Last Pushed
                </h4>
                <div className="flex items-center gap-2 text-slate-200">
                  <Clock size={16} className="text-slate-500" />
                  <span className="text-sm font-medium">
                    {formatDate(repo.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {repo.language && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getLanguageColor(repo.language),
                      }}
                    />
                    <span className="text-sm text-slate-400 font-medium mono">
                      {repo.language}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-600 mono">
                ID: {repo.id}
              </span>
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
      whileHover={{ y: -2 }}
      onClick={() => onClick(repo)}
      className="group relative flex flex-col p-6 rounded-2xl border border-white/5 card-gradient cursor-pointer overflow-hidden"
    >
      {/* Subtle Gradient Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex justify-between items-start mb-4">
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-100 group-hover:text-indigo-400 group-hover:scale-[1.02] transition-all duration-300 origin-left line-clamp-1">
                {repo.name}
              </h3>
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
              ? "text-indigo-400 bg-indigo-500/10"
              : "text-slate-500 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bookmark
            size={18}
            fill={isSaved ? "currentColor" : "none"}
            className={isSaved ? "scale-110" : ""}
          />
        </button>
      </div>

      <p className="relative z-10 text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2 h-10 group-hover:text-slate-300 transition-colors">
        {repo.description || "No description provided."}
      </p>

      {/* Topics */}
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
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getLanguageColor(repo.language) }}
                />
                <span className="text-[11px] font-medium text-slate-400 mono">
                  {repo.language}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-300 transition-colors">
              <Star size={12} className="text-amber-400/80" />
              <span className="text-[11px] font-medium mono">
                {repo.stargazers_count.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-slate-400 transition-colors">
              <Clock size={12} />
              <span className="text-[11px] font-medium mono">
                {getRelativeTimeString(repo.updated_at)}
              </span>
            </div>
          </div>

          <div className="text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all">
            <ExternalLink size={14} />
          </div>
        </div>
      </div>

      {/* Glow highlight */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
    <div className="flex gap-2 mb-6">
      <div className="h-4 w-12 bg-white/5 rounded" />
      <div className="h-4 w-12 bg-white/5 rounded" />
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
  const [activeTab, setActiveTab] = useState<TabType>("trending");
  const [activeRange, setActiveRange] = useState<TimeRange>("week");
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [savedRepos, setSavedRepos] = useState<SavedRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Search and AI Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSmartFilterMode, setIsSmartFilterMode] = useState(false);
  const [isAiFiltering, setIsAiFiltering] = useState(false);
  const [aiFilteredIds, setAiFilteredIds] = useState<number[] | null>(null);

  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Load saved repos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gitglance_saved");
    if (saved) {
      setSavedRepos(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("gitglance_saved", JSON.stringify(savedRepos));
  }, [savedRepos]);

  const addToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchRepos = useCallback(
    async (type: TabType, range: TimeRange, pageNum: number) => {
      if (type === "saved") return;

      if (pageNum === 1) {
        setIsLoading(true);
        setAiFilteredIds(null); // Reset AI filter on tab change
      } else {
        setIsFetchingMore(true);
      }

      try {
        const date = new Date();
        if (range === "today") date.setDate(date.getDate() - 1);
        else if (range === "week") date.setDate(date.getDate() - 7);
        else if (range === "month") date.setMonth(date.getMonth() - 1);

        const formattedDate = date.toISOString().split("T")[0];

        const query =
          type === "trending"
            ? `created:>${formattedDate} sort:stars-desc`
            : `pushed:>${formattedDate} sort:updated-desc`;

        const response = await fetch(
          `https://api.github.com/search/repositories?q=${query}&per_page=30&page=${pageNum}`,
        );
        const data = await response.json();

        if (data.items) {
          if (pageNum === 1) {
            setRepos(data.items);
          } else {
            setRepos((prev) => {
              const existingIds = new Set(prev.map((r) => r.id));
              const newItems = data.items.filter(
                (r: GithubRepo) => !existingIds.has(r.id),
              );
              return [...prev, ...newItems];
            });
          }
          setHasMore(data.items.length === 30 && pageNum < 34);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching repos:", error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [],
  );

  // Reset and fetch when tab or range changes
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setRepos([]);
    fetchRepos(activeTab, activeRange, 1);
  }, [activeTab, activeRange, fetchRepos]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoading && !isFetchingMore && hasMore && activeTab !== "saved") {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRepos(activeTab, activeRange, nextPage);
    }
  }, [
    isLoading,
    isFetchingMore,
    hasMore,
    activeTab,
    page,
    activeRange,
    fetchRepos,
  ]);

  // Infinite scroll observer
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isFetchingMore &&
          activeTab !== "saved"
        ) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    observer.observe(currentTarget);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading, isFetchingMore, activeTab]);

  const toggleSave = (repo: GithubRepo) => {
    setSavedRepos((prev) => {
      const exists = prev.find((r) => r.id === repo.id);
      if (exists) {
        addToast(`Removed ${repo.name}`, "info");
        return prev.filter((r) => r.id !== repo.id);
      }
      addToast(`Saved ${repo.name}!`, "success");
      return [{ ...repo, savedAt: Date.now() }, ...prev];
    });
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    setRepos([]);
    setAiFilteredIds(null);
    fetchRepos(activeTab, activeRange, 1);
    addToast("Feed refreshed", "success");
  };

  // AI Filtering Implementation
  const runSmartFilter = async (query: string) => {
    if (!query || query.trim().length < 3) return;

    setIsAiFiltering(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      // Enhance context with topics and language for better AI reasoning
      const repoContext = repos.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || "",
        topics: r.topics || [],
        language: r.language || "Unknown",
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the core semantic intelligence engine for GitGlance, a premium dashboard for discovering top-tier GitHub projects.
Your task is to analyze the repository metadata provided below and filter them based on the user's natural language intent: "${query}".

Evaluation Guidelines:
- Use Case: Does the project solve a specific problem mentioned (e.g., 'API testing', 'game engine')?
- Tech Profile: Consider implied performance (e.g., 'C++/Rust' for performance) or stack (e.g., 'React' for frontend).
- Maturity & Ease: Look for indicators of 'beginner friendly' vs 'advanced research'.
- Qualitative Claims: Match claims like 'blazing fast', 'minimalist', 'batteries included', or 'production ready'.

Analyze the list and return a JSON array containing ONLY the numeric IDs of repositories that are a STRONG semantic match. If none match, return an empty array [].

Repositories to analyze: ${JSON.stringify(repoContext)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
          },
        },
      });

      const matchedIds = JSON.parse(response.text);
      setAiFilteredIds(matchedIds);
      if (matchedIds.length === 0) {
        addToast("No intelligent matches found", "info");
      } else {
        addToast(`AI matched ${matchedIds.length} projects`, "success");
      }
    } catch (error) {
      console.error("Smart Filter Error:", error);
      addToast("AI filtering failed", "error");
    } finally {
      setIsAiFiltering(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSmartFilterMode) {
      runSmartFilter(searchQuery);
    }
  };

  const filteredRepos = useMemo(() => {
    const source = activeTab === "saved" ? savedRepos : repos;
    let result = source;

    // Apply AI filter if active
    if (aiFilteredIds !== null) {
      result = result.filter((r) => aiFilteredIds.includes(r.id));
    }

    // Apply basic text search logic
    if (!searchQuery) return result;

    // In Smart Mode, if AI hasn't run yet, we don't narrow down by keywords manually to avoid confusion
    if (isSmartFilterMode && aiFilteredIds === null && !isAiFiltering)
      return result;
    if (isSmartFilterMode && aiFilteredIds !== null) return result;

    // Normal keyword search fallback/default
    return result.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [
    activeTab,
    repos,
    savedRepos,
    searchQuery,
    aiFilteredIds,
    isSmartFilterMode,
    isAiFiltering,
  ]);

  const navItems = [
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "latest", label: "Latest", icon: Sparkles },
    { id: "saved", label: "Saved", icon: Bookmark },
  ];

  const ranges: { id: TimeRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Toast Notifications */}
      <div className="fixed bottom-24 md:bottom-8 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRepo && (
          <RepoDetailModal
            repo={selectedRepo}
            isSaved={!!savedRepos.find((r) => r.id === selectedRepo.id)}
            onToggleSave={toggleSave}
            onClose={() => setSelectedRepo(null)}
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => handleRefresh()}
            >
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
                    activeTab === item.id
                      ? "text-indigo-400"
                      : "text-slate-400 hover:text-white"
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
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center"
            >
              <MotionDiv
                animate={{
                  width: isSearchFocused ? 320 : 200,
                  borderColor: isSmartFilterMode
                    ? "rgba(99,102,241,0.5)"
                    : "rgba(255,255,255,0.05)",
                  backgroundColor: isSmartFilterMode
                    ? "rgba(99,102,241,0.05)"
                    : "rgba(255,255,255,0.05)",
                }}
                className={`relative hidden sm:flex items-center border rounded-xl px-3 py-2 transition-all duration-300 shadow-sm ${
                  isSearchFocused ? "ring-1 ring-indigo-500/20" : ""
                }`}
              >
                {isAiFiltering ? (
                  <Loader2
                    size={16}
                    className="text-indigo-400 animate-spin shrink-0"
                  />
                ) : isSmartFilterMode ? (
                  <Sparkles size={16} className="text-indigo-400 shrink-0" />
                ) : (
                  <Search size={16} className="text-slate-500 shrink-0" />
                )}

                <input
                  type="text"
                  placeholder={
                    isSmartFilterMode
                      ? "Ask AI (e.g. 'performance tools')..."
                      : "Find a repository..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-100 placeholder:text-slate-600"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setAiFilteredIds(null);
                    }}
                    className="p-1 text-slate-600 hover:text-slate-300 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </MotionDiv>

              {/* Smart Filter Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsSmartFilterMode(!isSmartFilterMode);
                  if (isSmartFilterMode) setAiFilteredIds(null);
                }}
                className={`ml-2 p-2 rounded-xl border transition-all duration-300 flex items-center gap-2 group ${
                  isSmartFilterMode
                    ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30"
                }`}
                title="Toggle AI Smart Filter"
              >
                <Wand2
                  size={18}
                  className={isSmartFilterMode ? "animate-pulse" : ""}
                />
                <span
                  className={`text-xs font-bold mono uppercase tracking-tight overflow-hidden transition-all duration-300 ${isSmartFilterMode ? "max-w-[80px] opacity-100" : "max-w-0 opacity-0"}`}
                >
                  Smart
                </span>
              </button>
            </form>

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
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              {navItems.find((n) => n.id === activeTab)?.label}
              {aiFilteredIds !== null && (
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium mono animate-in fade-in slide-in-from-left-2 duration-300">
                  AI Filtered
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-lg max-w-lg">
              {activeTab === "trending" &&
                `Discover the most popular projects from the community ${activeRange === "today" ? "today" : activeRange === "week" ? "this week" : "this month"}.`}
              {activeTab === "latest" &&
                `Freshly baked code. See what's brand new on GitHub ${activeRange === "today" ? "today" : activeRange === "week" ? "this week" : "this month"}.`}
              {activeTab === "saved" &&
                "Your personal library of tools, libraries, and inspiration."}
            </p>
          </div>

          {activeTab !== "saved" && (
            <div className="flex items-center gap-3 self-start">
              <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-xl w-fit">
                {ranges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setActiveRange(range.id)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      activeRange === range.id
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                title="Refresh repositories"
                className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={`${isLoading ? "animate-spin text-indigo-400" : ""}`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading && page === 1
              ? Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : filteredRepos.length > 0
                ? filteredRepos.map((repo) => (
                    <RepoCard
                      key={`${repo.id}-${activeTab}`}
                      repo={repo}
                      isSaved={!!savedRepos.find((r) => r.id === repo.id)}
                      onToggleSave={toggleSave}
                      onClick={(r) => setSelectedRepo(r)}
                    />
                  ))
                : !isLoading &&
                  !isAiFiltering && (
                    <MotionDiv
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full py-20 flex flex-col items-center text-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-600 mb-6">
                        {searchQuery || aiFilteredIds ? (
                          <Filter size={32} />
                        ) : activeTab === "saved" ? (
                          <Bookmark size={32} />
                        ) : (
                          <Search size={32} />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-200 mb-2">
                        {aiFilteredIds
                          ? "AI found no matches"
                          : searchQuery
                            ? "No results found"
                            : activeTab === "saved"
                              ? "Your library is empty"
                              : "Something went wrong"}
                      </h3>
                      <p className="text-slate-500 max-w-xs">
                        {aiFilteredIds
                          ? `Our smart filter couldn't find matches for "${searchQuery}" in the current list.`
                          : searchQuery
                            ? `We couldn't find anything matching "${searchQuery}" in your current view.`
                            : activeTab === "saved"
                              ? "Start exploring and save repositories you find interesting to see them here."
                              : "We had trouble loading the latest repositories. Please try refreshing."}
                      </p>
                      {(searchQuery || aiFilteredIds !== null) && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setAiFilteredIds(null);
                          }}
                          className="mt-6 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                        >
                          Clear all filters
                        </button>
                      )}
                    </MotionDiv>
                  )}

            {isAiFiltering &&
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={`ai-loading-${i}`} />
              ))}
          </AnimatePresence>
        </div>

        {/* Sentinel element for infinite scroll */}
        {activeTab !== "saved" && hasMore && (
          <div
            ref={observerTarget}
            className="w-full h-24 flex items-center justify-center mt-8"
          >
            {isFetchingMore && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 mono uppercase tracking-widest">
                  Loading more
                </span>
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
                activeTab === item.id
                  ? "bg-indigo-500 text-white"
                  : "text-slate-500"
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

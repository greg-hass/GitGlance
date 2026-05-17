import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, TrendingUp, X } from 'lucide-react';
import {
  clearCacheForRepo,
  fetchStarHistory,
  type FetchProgress,
  type StarDataPoint,
} from '../services/starHistory';

const chartWidth = 640;
const chartHeight = 180;
const chartPadding = 16;

const buildPath = (data: StarDataPoint[]) => {
  if (data.length < 2) return '';

  const max = Math.max(...data.map((point) => point.count));
  const min = Math.min(...data.map((point) => point.count));
  const range = Math.max(max - min, 1);

  return data
    .map((point, index) => {
      const x =
        chartPadding +
        (index / (data.length - 1)) * (chartWidth - chartPadding * 2);
      const y =
        chartHeight -
        chartPadding -
        ((point.count - min) / range) * (chartHeight - chartPadding * 2);

      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
};

export const StarGrowthChart: React.FC<{
  owner: string;
  name: string;
}> = ({ owner, name }) => {
  const [data, setData] = useState<StarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FetchProgress | null>(null);
  const [isPartial, setIsPartial] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(null);

    try {
      const result = await fetchStarHistory(owner, name, setProgress);
      setData(result.data.slice(-30));
      setIsPartial(result.isPartial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load star history.');
    } finally {
      setLoading(false);
    }
  }, [owner, name]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const path = useMemo(() => buildPath(data), [data]);
  const latest = data.at(-1);
  const first = data.at(0);
  const delta = latest && first ? latest.count - first.count : 0;

  const handleRetry = () => {
    clearCacheForRepo(owner, name);
    void loadData();
  };

  return (
    <div className="w-full mt-6 mb-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 mono">
          <TrendingUp size={14} className="text-indigo-400" />
          Star Growth
          {!loading && !error && (
            <span className="ml-2 text-[10px] text-emerald-400/70">Live Data</span>
          )}
        </h4>
        {isPartial && (
          <span className="text-right text-[10px] text-amber-400/70">
            First 10,000 stars
          </span>
        )}
      </div>

      <div className="h-[240px] rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-indigo-500" />
            {progress && (
              <>
                <p className="mb-2 text-sm text-slate-500">
                  Page {progress.currentPage} of {progress.totalPages}
                </p>
                <p className="text-xs text-slate-600">
                  {progress.loaded.toLocaleString()} stars loaded
                </p>
                <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{
                      width: `${(progress.currentPage / progress.totalPages) * 100}%`,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <X size={32} className="mb-4 text-rose-400" />
            <p className="mb-2 text-sm text-slate-300">Unable to load star history</p>
            <p className="max-w-xs text-xs text-slate-500">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400 transition-colors hover:bg-indigo-500/20"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        ) : data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Not enough star history yet.
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-600 mono">
                  Last {data.length} star events
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  +{delta.toLocaleString()} stars in this sample
                </p>
              </div>
              <p className="text-lg font-semibold text-white">
                {latest?.count.toLocaleString()}
              </p>
            </div>

            <svg
              className="min-h-0 flex-1 overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
              aria-label="Repository star growth chart"
            >
              <defs>
                <linearGradient id="star-growth-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${path} L ${chartWidth - chartPadding} ${chartHeight - chartPadding} L ${chartPadding} ${chartHeight - chartPadding} Z`}
                fill="url(#star-growth-fill)"
              />
              <path d={path} fill="none" stroke="#818cf8" strokeWidth="4" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

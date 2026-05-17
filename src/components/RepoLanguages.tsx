import { useState, useEffect } from 'react';
import { getLanguageColor } from '../lib/languageColors';
import { fetchGitHubJson } from '../services/github';

export const RepoLanguages: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await fetchGitHubJson<Record<string, number>>(
          `https://api.github.com/repos/${owner}/${name}/languages`,
        );
        setLanguages(data);
      } catch {
        setLanguages({});
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
        <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">Languages</h4>
        <div className="h-2 w-full bg-white/5 rounded-full animate-pulse" />
      </div>
    );
  }

  if (sortedLangs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] text-slate-500 mono uppercase tracking-[0.2em]">Primary Languages</h4>
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
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {sortedLangs.map(([lang, value]) => (
          <div key={lang} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getLanguageColor(lang) }} />
            <span className="text-xs font-medium text-slate-200 mono">{lang}</span>
            <span className="text-xs text-slate-500 mono">{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

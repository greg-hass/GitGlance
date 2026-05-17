import { Github, TrendingUp, Sparkles, Bookmark } from 'lucide-react';
import type { TabType } from '../types';

export const MobileNav: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'trending' as TabType, icon: TrendingUp },
    { id: 'latest' as TabType, icon: Sparkles },
    { id: 'saved' as TabType, icon: Bookmark },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 mobile-nav-safe">
      <div className="glass border border-white/10 rounded-2xl flex justify-around p-3 shadow-2xl shadow-black/50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`p-3 rounded-xl transition-all ${
              activeTab === item.id
                ? 'bg-indigo-500 text-white'
                : 'text-slate-500'
            }`}
          >
            <item.icon size={20} />
          </button>
        ))}
      </div>
    </div>
  );
};

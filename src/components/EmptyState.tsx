import { motion } from 'framer-motion';
import { Filter, Bookmark, Search } from 'lucide-react';

export const EmptyState: React.FC<{
  searchQuery: string;
  activeTab: string;
  onClear: () => void;
}> = ({ searchQuery, activeTab, onClear }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="col-span-full py-20 flex flex-col items-center text-center"
  >
    <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-600 mb-6">
      {searchQuery ? (
        <Filter size={32} />
      ) : activeTab === 'saved' ? (
        <Bookmark size={32} />
      ) : (
        <Search size={32} />
      )}
    </div>
    <h3 className="text-xl font-semibold text-slate-200 mb-2">
      {searchQuery
          ? 'No results found'
          : activeTab === 'saved'
            ? 'Your library is empty'
            : 'Something went wrong'}
    </h3>
    <p className="text-slate-500 max-w-xs">
      {searchQuery
          ? `We couldn't find anything matching "${searchQuery}" in your current view.`
          : activeTab === 'saved'
            ? 'Start exploring and save repositories you find interesting to see them here.'
            : 'We had trouble loading the latest repositories. Please try refreshing.'}
    </p>
    {searchQuery && (
      <button
        onClick={onClear}
        className="mt-6 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
      >
        Clear all filters
      </button>
    )}
  </motion.div>
);

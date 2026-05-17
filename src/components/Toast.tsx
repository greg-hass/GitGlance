import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, Trash2 } from 'lucide-react';
import type { Toast } from '../types';

export const ToastItem: React.FC<{
  toast: Toast;
  onDismiss: (id: number) => void;
}> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#121214] border border-white/10 shadow-2xl pointer-events-auto min-w-[200px]"
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      ) : toast.type === 'error' ? (
        <X size={18} className="text-rose-400 shrink-0" />
      ) : (
        <Trash2 size={18} className="text-slate-400 shrink-0" />
      )}
      <span className="text-sm font-medium text-slate-200">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

export const SkeletonCard = () => (
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

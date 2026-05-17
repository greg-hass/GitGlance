import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { useRepositories } from "./hooks/useRepositories";
import { useSavedRepos } from "./hooks/useSavedRepos";
import { Header } from "./components/Header";
import { MobileNav } from "./components/MobileNav";
import { RepoCard } from "./components/RepoCard";
import { RepoDetailModal } from "./components/RepoDetailModal";
import { SkeletonCard } from "./components/SkeletonCard";
import { EmptyState } from "./components/EmptyState";
import { ToastItem } from "./components/Toast";
import type { TabType, TimeRange, GithubRepo, Toast } from "./types";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("trending");
  const [activeRange, setActiveRange] = useState<TimeRange>("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { repos, isLoading, isFetchingMore, hasMore, error, loadMore, refresh } =
    useRepositories(activeTab, activeRange);
  const { savedRepos, isSaved, toggleSave } = useSavedRepos();

  const observerTarget = useRef<HTMLDivElement>(null);

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToggleSave = useCallback(
    (repo: GithubRepo) => {
      toggleSave(repo);
      const saved = isSaved(repo.id);
      addToast(saved ? `Removed ${repo.name}` : `Saved ${repo.name}!`, saved ? "info" : "success");
    },
    [toggleSave, isSaved, addToast],
  );

  const handleRefresh = useCallback(() => {
    setSearchQuery("");
    refresh();
    addToast("Feed refreshed", "success");
  }, [refresh, addToast]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
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

  const filteredRepos = useMemo(() => {
    const source = activeTab === "saved" ? savedRepos : repos;

    if (!searchQuery) return source;

    return source.filter(
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
  ]);

  const displayError = error && !isLoading ? error : null;

  return (
    <div
      className="min-h-screen pb-32 overflow-x-hidden relative"
      style={{ paddingTop: "calc(64px + var(--safe-top))" }}
    >
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
            isSaved={isSaved(selectedRepo.id)}
            onToggleSave={handleToggleSave}
            onClose={() => setSelectedRepo(null)}
          />
        )}
      </AnimatePresence>

      <Header
        activeTab={activeTab}
        activeRange={activeRange}
        searchQuery={searchQuery}
        isLoading={isLoading}
        onTabChange={setActiveTab}
        onRangeChange={setActiveRange}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onRefresh={handleRefresh}
      />

      <main className="max-w-7xl mx-auto px-6 pt-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              {activeTab === "trending" && "Trending"}
              {activeTab === "latest" && "Latest"}
              {activeTab === "saved" && "Saved"}
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
        </div>

        {displayError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {displayError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading && !displayError
              ? Array.from({ length: 12 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : filteredRepos.length > 0
                ? filteredRepos.map((repo) => (
                    <RepoCard
                      key={`${repo.id}-${activeTab}`}
                      repo={repo}
                      isSaved={isSaved(repo.id)}
                      onToggleSave={handleToggleSave}
                      onClick={(r) => setSelectedRepo(r)}
                    />
                  ))
                : !isLoading &&
                  (
                    <EmptyState
                      searchQuery={searchQuery}
                      activeTab={activeTab}
                      onClear={handleClearFilters}
                    />
                  )}
          </AnimatePresence>
        </div>

        {activeTab !== "saved" && hasMore && (
          <div
            ref={observerTarget}
            className="w-full h-24 flex items-center justify-center mt-8"
          >
            {isFetchingMore && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 mono uppercase tracking-widest">
                  Loading more
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;

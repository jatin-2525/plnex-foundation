'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import {
  SearchResultType,
  SearchResultItem,
  RecentSearchEntry,
  INITIAL_RECENT_SEARCHES,
  executeGlobalSearch,
} from '../../lib/domain/searchData';
import { ActivityDrawerTab } from '../../lib/domain/activityDetailData';
import {
  Search,
  X,
  Layers,
  FileText,
  Camera,
  AlertTriangle,
  FileBarChart,
  FolderGit2,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  Clock,
  RotateCcw,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Tag,
  Building2,
  ChevronRight,
  ShieldCheck,
  Check,
  Filter,
} from 'lucide-react';

// Icon mapper for the 7 search entity types
function getEntityTypeIcon(type: SearchResultType) {
  switch (type) {
    case 'Project':
      return <FolderGit2 className="w-3.5 h-3.5 text-[#0284C7]" />;
    case 'Activity':
      return <Layers className="w-3.5 h-3.5 text-[#176B87]" />;
    case 'Execution Event':
      return <FileText className="w-3.5 h-3.5 text-[#3B6EA8]" />;
    case 'Evidence':
      return <Camera className="w-3.5 h-3.5 text-[#2E7D5B]" />;
    case 'Review Item':
      return <Sparkles className="w-3.5 h-3.5 text-[#D98B32]" />;
    case 'Risk':
      return <AlertTriangle className="w-3.5 h-3.5 text-[#B5473C]" />;
    case 'Report':
      return <FileBarChart className="w-3.5 h-3.5 text-[#3B6EA8]" />;
    default:
      return <Search className="w-3.5 h-3.5 text-[#596579]" />;
  }
}

// Entity type badge style
function getEntityTypeBadge(type: SearchResultType) {
  switch (type) {
    case 'Project':
      return 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]';
    case 'Activity':
      return 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]';
    case 'Execution Event':
      return 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]';
    case 'Evidence':
      return 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]';
    case 'Review Item':
      return 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]';
    case 'Risk':
      return 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]';
    case 'Report':
      return 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]';
    default:
      return 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]';
  }
}

// Status badge styling helper
function getStatusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (
    s.includes('active') ||
    s.includes('completed') ||
    s.includes('verified') ||
    s.includes('auto') ||
    s.includes('high') ||
    s.includes('on track')
  ) {
    return 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]';
  }
  if (
    s.includes('review') ||
    s.includes('warning') ||
    s.includes('moderate') ||
    s.includes('available') ||
    s.includes('planning')
  ) {
    return 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]';
  }
  if (
    s.includes('delayed') ||
    s.includes('critical') ||
    s.includes('conflict') ||
    s.includes('unmatched') ||
    s.includes('failed')
  ) {
    return 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]';
  }
  return 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]';
}

export function GlobalSearch() {
  const router = useRouter();
  const { globalSearchOpen, setGlobalSearchOpen, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchResultType | 'ALL'>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>(INITIAL_RECENT_SEARCHES);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  // Focus input on open
  useEffect(() => {
    if (globalSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setHasError(false);
      setActiveCategory('ALL');
    }
  }, [globalSearchOpen]);

  // Execute debounced search
  useEffect(() => {
    if (!globalSearchOpen) return;

    let isSubscribed = true;
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(async () => {
      try {
        const data = await executeGlobalSearch(query, activeCategory);
        if (isSubscribed) {
          setResults(data);
          setIsLoading(false);
          setSelectedIndex(0);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(err?.message || 'Error executing search query.');
        }
      }
    }, 120);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [query, activeCategory, globalSearchOpen]);

  // Handle selecting a search result
  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      // 1. Add to recent searches
      const newEntry: RecentSearchEntry = {
        id: `rec-${Date.now()}`,
        query: item.title,
        timestamp: new Date().toISOString(),
        relativeTime: 'Just now',
        resultItem: item,
      };
      setRecentSearches((prev) => [newEntry, ...prev.filter((r) => r.query !== item.title)].slice(0, 8));

      // 2. Close search modal
      setGlobalSearchOpen(false);

      // 3. Trigger drawer action or page navigation
      if (item.destination.drawerType === 'activity' && item.destination.targetId) {
        const targetTab = (item.destination.tab as ActivityDrawerTab) || 'overview';
        openActivityDrawer(item.destination.targetId, targetTab);
      }

      if (item.destination.route) {
        router.push(item.destination.route);
      }

      addToast({
        type: 'info',
        title: `${item.type}: ${item.id}`,
        description: `Navigating to ${item.title}...`,
      });
    },
    [router, setGlobalSearchOpen, openActivityDrawer, addToast]
  );

  // Keyboard navigation within results list (ArrowDown, ArrowUp, Enter)
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const handleRemoveRecentItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((r) => r.id !== id));
  };

  if (!globalSearchOpen) return null;

  const categories: Array<{ id: SearchResultType | 'ALL'; label: string }> = [
    { id: 'ALL', label: 'All Entities' },
    { id: 'Project', label: 'Projects' },
    { id: 'Activity', label: 'Activities' },
    { id: 'Execution Event', label: 'Execution Events' },
    { id: 'Evidence', label: 'Evidence' },
    { id: 'Review Item', label: 'Review Items' },
    { id: 'Risk', label: 'Risks' },
    { id: 'Report', label: 'Reports' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="PLnEX Global Universal Search"
      data-testid="plnex-global-search"
    >
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-[#172033]/50 transition-opacity duration-150"
        onClick={() => setGlobalSearchOpen(false)}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4">
        <div
          className="relative w-full max-w-3xl bg-white rounded-lg border border-[#D9DEE5] shadow-lg overflow-hidden duration-150 flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* =========================================================================
              1. SEARCH INPUT HEADER
              ========================================================================= */}
          <div className="flex items-center px-4 py-3.5 border-b border-[#D9DEE5] bg-white gap-3">
            <Search className="w-5 h-5 text-[#7B8798] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search across Projects, Activities, Events, Evidence, Review items, Risks, Reports..."
              className="w-full text-sm bg-transparent outline-none text-[#172033] placeholder-[#7B8798]"
            />

            {isLoading && (
              <Loader2 className="w-4 h-4 text-[#176B87] animate-spin shrink-0" />
            )}

            {query && !isLoading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[#7B8798] hover:text-[#172033] p-1 rounded transition-colors"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-[#596579] bg-[#F1F3F5] border border-[#D9DEE5] rounded">
              ESC
            </kbd>
          </div>

          {/* =========================================================================
              2. CATEGORY PILL FILTER CAROUSEL (THE 7 ENTITY TYPES)
              ========================================================================= */}
          <div className="px-4 py-2 bg-[#F7F8FA] border-b border-[#D9DEE5] flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-[#176B87] text-white border-[#176B87] shadow-xs'
                      : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* =========================================================================
              3. SEARCH RESULTS & DYNAMIC STATES BODY
              ========================================================================= */}
          <div
            ref={resultsContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-[#F1F3F5]"
          >
            {/* STATE 1: ERROR STATE */}
            {hasError && (
              <div className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#FBEFEE] text-[#B5473C] flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172033]">
                    Search Query Failed
                  </h4>
                  <p className="text-[11px] text-[#596579] mt-0.5 max-w-sm mx-auto">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setQuery('');
                  }}
                  className="px-3 py-1.5 bg-[#176B87] text-white rounded-lg text-xs font-semibold hover:bg-[#135A72] transition-colors"
                >
                  Reset Search Index
                </button>
              </div>
            )}

            {/* STATE 2: LOADING SKELETON */}
            {isLoading && !hasError && (
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs text-[#596579]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#176B87]" />
                  <span>Scanning multi-entity project index...</span>
                </div>
                <div className="space-y-2 opacity-50">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] animate-pulse h-16"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* STATE 3: NO RESULTS STATE */}
            {!isLoading && !hasError && query && results.length === 0 && (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F3F5] text-[#7B8798] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172033]">
                    No Results Found for &ldquo;{query}&rdquo;
                  </h4>
                  <p className="text-[11px] text-[#596579] mt-0.5 max-w-sm mx-auto">
                    No matching Projects, Activities, Events, Evidence, Review Items, Risks, or Reports were located.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] text-[#7B8798]">Try searching:</span>
                  {['PIP-24-001', 'Line 24', 'EVT-2026-001', 'DPR', 'RSK-001'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-2 py-0.5 rounded bg-[#F1F3F5] hover:bg-[#E5E9F0] text-[#176B87] font-mono text-[11px] border border-[#D9DEE5]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STATE 4: RECENT SEARCHES (When query is empty) */}
            {!isLoading && !hasError && !query && (
              <div className="space-y-3 p-2">
                <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#176B87]" />
                    Recent Searches & Quick Queries
                  </span>
                  {recentSearches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className="text-[10px] text-[#7B8798] hover:text-[#B5473C] transition-colors"
                    >
                      Clear Recent
                    </button>
                  )}
                </div>

                {recentSearches.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-[#7B8798] italic text-center">
                    No recent searches yet. Enter an Activity ID, line tag, or report name.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {recentSearches.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          if (rec.resultItem) {
                            handleSelectResult(rec.resultItem);
                          } else {
                            setQuery(rec.query);
                          }
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F1F3F5] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded bg-white border border-[#D9DEE5] flex items-center justify-center shrink-0 text-[#7B8798]">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-[#172033] block truncate">
                              {rec.query}
                            </span>
                            {rec.resultItem && (
                              <span className="text-[10px] text-[#596579] font-mono">
                                {rec.resultItem.type} · {rec.resultItem.id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-[#7B8798]">
                            {rec.relativeTime}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveRecentItem(rec.id, e)}
                            className="p-1 text-[#7B8798] hover:text-[#B5473C] opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from history"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Discover suggestions */}
                <div className="pt-3 border-t border-[#F1F3F5]">
                  <span className="px-2 text-[10px] uppercase font-semibold text-[#596579] block mb-2">
                    Quick Jump Suggestions (Across 7 Data Stores):
                  </span>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {[
                      { label: 'Line 24 Erection (PIP-24-001)', query: 'PIP-24-001' },
                      { label: 'Unmatched Drain (EVT-2026-004)', query: 'EVT-2026-004' },
                      { label: 'Daily Progress Report', query: 'Daily Progress Report' },
                      { label: 'Pour Certificate (EVD-001)', query: 'EVD-001' },
                      { label: 'Header Risk (RSK-001)', query: 'RSK-001' },
                      { label: 'Duliajan Unit A', query: 'PRJ-OIL-2026-01' },
                    ].map((s) => (
                      <button
                        key={s.query}
                        type="button"
                        onClick={() => setQuery(s.query)}
                        className="px-2.5 py-1 bg-[#F7F8FA] hover:bg-[#EDF5F8] text-[#172033] hover:text-[#176B87] rounded-md text-xs border border-[#D9DEE5] transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATE 5: MATCHED RESULTS LIST */}
            {!isLoading && !hasError && query && results.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-[#596579] flex items-center justify-between">
                  <span>
                    Results ({results.length} entities found across project index)
                  </span>
                  <span className="font-mono text-[10px]">
                    Use ↑↓ arrows to navigate, ↵ to select
                  </span>
                </div>

                {results.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const typeBadgeClass = getEntityTypeBadge(item.type);
                  const statusBadgeClass = getStatusBadgeClass(item.status);

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#EDF5F8] border-[#176B87] shadow-xs'
                          : 'bg-white border-[#D9DEE5] hover:border-[#B3CBE0]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Meta Line: Type + ID + Project */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. TYPE */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${typeBadgeClass}`}
                          >
                            {getEntityTypeIcon(item.type)}
                            <span>{item.type}</span>
                          </span>

                          {/* 2. ID */}
                          <span className="font-mono font-bold text-xs text-[#176B87] bg-white px-1.5 py-0.2 rounded border border-[#D9DEE5]">
                            {item.id}
                          </span>

                          {/* 3. PROJECT */}
                          <span className="text-[11px] text-[#596579] font-medium truncate max-w-[200px]">
                            {item.project}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-[#172033] leading-snug">
                          {item.title}
                        </h4>

                        {/* Optional description snippet */}
                        {item.description && (
                          <p className="text-[11px] text-[#596579] line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Right Meta: Status Badge + Action Indicator */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* 4. STATUS */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border font-mono capitalize ${statusBadgeClass}`}
                        >
                          {item.status}
                        </span>

                        <span className="text-[11px] font-bold text-[#176B87] inline-flex items-center gap-1 group">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* =========================================================================
              4. FOOTER BAR WITH KEYBOARD SHORTCUT HELPER
              ========================================================================= */}
          <div className="px-4 py-2.5 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-between text-xs text-[#596579] flex-wrap gap-2">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-white border border-[#D9DEE5] rounded font-mono text-[10px]">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-white border border-[#D9DEE5] rounded font-mono text-[10px]">
                  ↵
                </kbd>
                <span>Open Destination</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 bg-white border border-[#D9DEE5] rounded font-mono text-[10px]">
                  ESC
                </kbd>
                <span>Dismiss</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#7B8798]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B87]" />
              <span>Full Cross-Entity Project Index</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;

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
import { StatusBadge } from '../shared/StatusBadge';
import {
  Search,
  X,
  Layers,
  FileText,
  Camera,
  AlertTriangle,
  FileBarChart,
  FolderGit2,
  CheckSquare,
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
      return <Layers className="w-3.5 h-3.5 text-[#0F6B68]" />;
    case 'Execution Event':
      return <FileText className="w-3.5 h-3.5 text-[#3B6EA8]" />;
    case 'Evidence':
      return <Camera className="w-3.5 h-3.5 text-[#2E7D5B]" />;
    case 'Review Item':
      return <CheckSquare className="w-3.5 h-3.5 text-[#845006]" />;
    case 'Risk':
      return <AlertTriangle className="w-3.5 h-3.5 text-[#A24335]" />;
    case 'Report':
      return <FileBarChart className="w-3.5 h-3.5 text-[#3B6EA8]" />;
    default:
      return <Search className="w-3.5 h-3.5 text-[#526779]" />;
  }
}

// Entity type badge style
function getEntityTypeBadge(type: SearchResultType) {
  switch (type) {
    case 'Project':
      return 'bg-[#EAF0F5] text-[#0F6B68] border-[#D8E2EA]';
    case 'Activity':
      return 'bg-[#EAF0F5] text-[#0F6B68] border-[#D8E2EA]';
    case 'Execution Event':
      return 'bg-[#EAF0F5] text-[#3B6EA8] border-[#D8E2EA]';
    case 'Evidence':
      return 'bg-[#E4F4EC] text-[#2E7D5B] border-[#B8DCC9]';
    case 'Review Item':
      return 'bg-[#FFF1D3] text-[#8C5311] border-[#F0D4A6]';
    case 'Risk':
      return 'bg-[#FCE8E4] text-[#A24335] border-[#E4B0AA]';
    case 'Report':
      return 'bg-[#EAF0F5] text-[#3B6EA8] border-[#D8E2EA]';
    default:
      return 'bg-[#EAF0F5] text-[#526779] border-[#D8E2EA]';
  }
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
        className="fixed inset-0 bg-[#142C3F]/50"
        onClick={() => setGlobalSearchOpen(false)}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-start justify-center pt-16 sm:pt-24 p-3 sm:p-4">
        <div
          className="relative w-full max-w-3xl bg-white rounded-lg border border-[#D8E2EA] shadow-lg overflow-hidden flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* =========================================================================
              1. SEARCH INPUT HEADER
              ========================================================================= */}
          <div className="flex items-center px-4 py-3 border-b border-[#D8E2EA] bg-white gap-3">
            <Search className="w-5 h-5 text-[#7B8798] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search across Projects, Activities, Events, Evidence, Review items, Risks, Reports..."
              className="w-full text-sm bg-transparent outline-none text-[#142C3F] placeholder-[#7B8798]"
            />

            {isLoading && (
              <Loader2 className="w-4 h-4 text-[#0F6B68] animate-spin shrink-0" />
            )}

            {query && !isLoading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[#7B8798] hover:text-[#142C3F] p-1 rounded transition-colors"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-[#526779] bg-[#EAF0F5] border border-[#D8E2EA] rounded">
              ESC
            </kbd>
          </div>

          {/* =========================================================================
              2. CATEGORY PILL FILTER CAROUSEL (THE 7 ENTITY TYPES)
              ========================================================================= */}
          <div className="px-4 py-2 bg-[#F3F6FA] border-b border-[#D8E2EA] flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                    isSelected
                      ? 'bg-[#0F6B68] text-white border-[#0F6B68] shadow-xs'
                      : 'bg-white border-[#D8E2EA] text-[#526779] hover:bg-[#EAF0F5]'
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
            className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-[#EAF0F5]"
          >
            {/* STATE 1: ERROR STATE */}
            {hasError && (
              <div className="p-6 text-center space-y-2 max-w-sm mx-auto" role="alert">
                <div className="w-8 h-8 rounded-full bg-[#FCE8E4] border border-[#E4B0AA] flex items-center justify-center text-[#A24335] mx-auto">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#142C3F]">
                    Search could not be completed.
                  </h4>
                  <p className="text-[11px] text-[#526779] mt-0.5 leading-relaxed">
                    {errorMessage || 'The search index is temporarily unavailable. Check your query syntax or retry search.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0F6B68] hover:bg-[#135A72] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry Search</span>
                </button>
              </div>
            )}

            {/* STATE 2: LOADING INDICATOR */}
            {isLoading && !hasError && (
              <div className="p-8 text-center" role="status" aria-live="polite">
                <div className="inline-flex items-center gap-2 text-xs text-[#526779]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F6B68] flex-shrink-0" />
                  <span className="font-medium text-[#142C3F]">Scanning master index...</span>
                </div>
              </div>
            )}

            {/* STATE 3: NO RESULTS STATE */}
            {!isLoading && !hasError && query && results.length === 0 && (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#EAF0F5] text-[#7B8798] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#142C3F]">
                    No Results Found for &ldquo;{query}&rdquo;
                  </h4>
                  <p className="text-[11px] text-[#526779] mt-0.5 max-w-sm mx-auto">
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
                      className="px-2 py-0.5 rounded bg-[#EAF0F5] hover:bg-[#E5E9F0] text-[#0F6B68] font-mono text-[11px] border border-[#D8E2EA]"
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
                <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-[#526779]">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#0F6B68]" />
                    Recent Searches & Quick Queries
                  </span>
                  {recentSearches.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRecent}
                      className="text-[10px] text-[#7B8798] hover:text-[#A24335] transition-colors"
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
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-[#EAF0F5] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded bg-white border border-[#D8E2EA] flex items-center justify-center shrink-0 text-[#7B8798]">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-[#142C3F] block truncate">
                              {rec.query}
                            </span>
                            {rec.resultItem && (
                              <span className="text-[10px] text-[#526779] font-mono">
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
                            className="p-1 text-[#7B8798] hover:text-[#A24335] opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="pt-3 border-t border-[#EAF0F5]">
                  <span className="px-2 text-[10px] uppercase font-semibold text-[#526779] block mb-2">
                    Quick Jump Suggestions (Across 7 Data Stores):
                  </span>
                  <div className="flex flex-wrap gap-2 px-2">
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
                        className="px-3 py-1 bg-[#F3F6FA] hover:bg-[#EAF0F5] text-[#142C3F] hover:text-[#0F6B68] rounded-md text-xs border border-[#D8E2EA] transition-colors"
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
                <div className="px-2 py-1 text-[11px] font-semibold text-[#526779] flex items-center justify-between">
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

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#EAF0F5] border-[#0F6B68] shadow-xs'
                          : 'bg-white border-[#D8E2EA] hover:border-[#D8E2EA]'
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
                          <span className="font-mono font-bold text-xs text-[#0F6B68] bg-white px-1.5 py-0.5 rounded border border-[#D8E2EA]">
                            {item.id}
                          </span>

                          {/* 3. PROJECT */}
                          <span className="text-[11px] text-[#526779] font-medium truncate max-w-[200px]">
                            {item.project}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-[#142C3F] leading-snug">
                          {item.title}
                        </h4>

                        {/* Optional description snippet */}
                        {item.description && (
                          <p className="text-[11px] text-[#526779] line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Right Meta: Status Badge + Action Indicator */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* 4. STATUS */}
                        <StatusBadge status={item.status} size="xs" />

                        <span className="text-[11px] font-bold text-[#0F6B68] inline-flex items-center gap-1">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
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
          <div className="px-4 py-2 bg-[#F3F6FA] border-t border-[#D8E2EA] flex items-center justify-between text-xs text-[#526779] flex-wrap gap-2">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#D8E2EA] rounded font-mono text-[10px]">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#D8E2EA] rounded font-mono text-[10px]">
                  ↵
                </kbd>
                <span>Open Destination</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-[#D8E2EA] rounded font-mono text-[10px]">
                  ESC
                </kbd>
                <span>Dismiss</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#7B8798]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F6B68]" />
              <span>Full Cross-Entity Project Index</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;

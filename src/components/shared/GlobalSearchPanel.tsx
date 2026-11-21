'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { StatusBadge } from './StatusBadge';
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
  Clock,
  AlertCircle,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

function getEntityTypeIcon(type: SearchResultType) {
  switch (type) {
    case 'Project':
      return <FolderGit2 className="w-3.5 h-3.5 text-[#0284C7]" />;
    case 'Activity':
      return <Layers className="w-3.5 h-3.5 text-[#006B61]" />;
    case 'Execution Event':
      return <FileText className="w-3.5 h-3.5 text-[#2C6475]" />;
    case 'Evidence':
      return <Camera className="w-3.5 h-3.5 text-[#1F6B4E]" />;
    case 'Review Item':
      return <CheckSquare className="w-3.5 h-3.5 text-[#825700]" />;
    case 'Risk':
      return <AlertTriangle className="w-3.5 h-3.5 text-[#A43B36]" />;
    case 'Report':
      return <FileBarChart className="w-3.5 h-3.5 text-[#2C6475]" />;
    default:
      return <Search className="w-3.5 h-3.5 text-[#52665D]" />;
  }
}

function getEntityTypeBadge(type: SearchResultType) {
  switch (type) {
    case 'Project':
      return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#0284C7] dark:text-[#38BDF8] border-[#D9E2DA] dark:border-[#3A5146]';
    case 'Activity':
      return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#006B61] dark:text-[#72C6AD] border-[#D9E2DA] dark:border-[#3A5146]';
    case 'Execution Event':
      return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#2C6475] dark:text-[#9CCBD4] border-[#D9E2DA] dark:border-[#3A5146]';
    case 'Evidence':
      return 'bg-[#E4F1E9] dark:bg-[#20382C] text-[#1F6B4E] dark:text-[#9AD5AF] border-[#B7DAC3] dark:border-[#315442]';
    case 'Review Item':
      return 'bg-[#F8EFDA] dark:bg-[#3A3120] text-[#825700] dark:text-[#F3D27E] border-[#E5C185] dark:border-[#5B4A2B]';
    case 'Risk':
      return 'bg-[#F6E4E1] dark:bg-[#3B2422] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5B3734]';
    case 'Report':
      return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#2C6475] dark:text-[#9CCBD4] border-[#D9E2DA] dark:border-[#3A5146]';
    default:
      return 'bg-[#EAF0E9] dark:bg-[#203129] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146]';
  }
}

export interface GlobalSearchPanelProps {
  className?: string;
  showHeading?: boolean;
}

export function GlobalSearchPanel({
  className = '',
  showHeading = true,
}: GlobalSearchPanelProps) {
  const router = useRouter();
  const { openActivityDrawer } = useApp();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchResultType | 'ALL'>('ALL');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>(INITIAL_RECENT_SEARCHES);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)) {
      setIsMac(true);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(async () => {
      try {
        const data = await executeGlobalSearch(query, activeCategory);
        if (isSubscribed) {
          setResults(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setIsLoading(false);
          setHasError(true);
          setErrorMessage(err?.message || 'Error executing search.');
        }
      }
    }, 120);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [query, activeCategory]);

  const handleSelectResult = (item: SearchResultItem) => {
    const newEntry: RecentSearchEntry = {
      id: `rec-${Date.now()}`,
      query: item.title,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
      resultItem: item,
    };
    setRecentSearches((prev) => [newEntry, ...prev.filter((r) => r.query !== item.title)].slice(0, 8));

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
  };

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
      className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg overflow-hidden shadow-xs flex flex-col ${className}`}
      data-testid="plnex-global-search-panel"
    >
      {/* 1. Header Bar */}
      {showHeading && (
        <div className="p-4 border-b border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#EAF0E9] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-center text-[#006B61] dark:text-[#72C6AD]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                Universal Project Search Engine
              </h3>
              <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                Full indexing across Projects, Activities, Events, Evidence, Review Items, Risks, and Reports
              </p>
            </div>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5] bg-[#EAF0E9] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] rounded">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
      )}

      {/* 2. Input Box */}
      <div className="p-4 bg-white dark:bg-[#17221D] border-b border-[#D9E2DA] dark:border-[#3A5146] space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#738A80] dark:text-[#859688] absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities (PIP-24-001), line numbers, DPRs, risks, evidence certificates..."
            className="w-full pl-9 pr-8 py-2 bg-[#F6F7F3] dark:bg-[#203129] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md text-xs text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] dark:placeholder-[#859688] focus:outline-none focus:border-[#006B61] dark:focus:border-[#72C6AD] focus:bg-white dark:focus:bg-[#101815]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-[#738A80] dark:text-[#859688] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin text-xs">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                    : 'bg-[#F6F7F3] dark:bg-[#203129] border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Results Container */}
      <div className="p-3 divide-y divide-[#D9E2DA] dark:divide-[#3A5146] max-h-[500px] overflow-y-auto">
        {hasError && (
          <div className="p-6 text-center space-y-2 max-w-sm mx-auto" role="alert">
            <div className="w-8 h-8 rounded-full bg-[#F6E4E1] dark:bg-[#3B2422] border border-[#DCABA7] dark:border-[#5B3734] flex items-center justify-center text-[#A43B36] dark:text-[#FF9E94] mx-auto">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">
                Search could not be completed.
              </h4>
              <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5 leading-relaxed">
                {errorMessage || 'The search index is temporarily unavailable. Check your query syntax or retry search.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setQuery('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] text-white dark:text-[#0B2822] text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Search</span>
            </button>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="p-6 text-center" role="status" aria-live="polite">
            <div className="inline-flex items-center gap-2 text-xs text-[#52665D] dark:text-[#B5C1B5]">
              <Loader2 className="w-4 h-4 animate-spin text-[#006B61] dark:text-[#72C6AD] flex-shrink-0" />
              <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">Searching master index...</span>
            </div>
          </div>
        )}

        {!isLoading && !hasError && query && results.length === 0 && (
          <div className="p-6 text-center space-y-2">
            <Search className="w-6 h-6 text-[#738A80] dark:text-[#859688] mx-auto" />
            <p className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
              No Results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
              Try searching with another activity code or entity term.
            </p>
          </div>
        )}

        {!isLoading && !hasError && !query && (
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#52665D] dark:text-[#B5C1B5] uppercase">
              <span>Recent Searches</span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecentSearches([])}
                  className="text-[10px] text-[#738A80] dark:text-[#859688] hover:text-[#A43B36] dark:hover:text-[#FF9E94]"
                >
                  Clear
                </button>
              )}
            </div>

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
                  className="p-2 rounded-lg hover:bg-[#F6F7F3] dark:hover:bg-[#203129] flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#738A80] dark:text-[#859688]" />
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">{rec.query}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#738A80] dark:text-[#859688]">{rec.relativeTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !hasError && query && results.length > 0 && (
          <div className="space-y-1">
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelectResult(item)}
                className="p-3 rounded-lg hover:bg-[#EAF0E9]/40 dark:hover:bg-[#203129]/60 border border-transparent hover:border-[#D9E2DA] dark:hover:border-[#3A5146] transition-colors cursor-pointer flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getEntityTypeBadge(
                        item.type
                      )}`}
                    >
                      {getEntityTypeIcon(item.type)}
                      <span>{item.type}</span>
                    </span>
                    <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">{item.id}</span>
                    <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] truncate">{item.project}</span>
                  </div>

                  <h4 className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] line-clamp-1">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[11px] font-bold text-[#006B61] dark:text-[#72C6AD] inline-flex items-center gap-1">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalSearchPanel;

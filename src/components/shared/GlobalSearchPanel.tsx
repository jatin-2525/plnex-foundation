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
      return 'bg-[#EAF0E9] text-[#006B61] border-[#D9E2DA]';
    case 'Activity':
      return 'bg-[#EAF0E9] text-[#006B61] border-[#D9E2DA]';
    case 'Execution Event':
      return 'bg-[#EAF0E9] text-[#2C6475] border-[#D9E2DA]';
    case 'Evidence':
      return 'bg-[#E4F1E9] text-[#1F6B4E] border-[#B7DAC3]';
    case 'Review Item':
      return 'bg-[#F8EFDA] text-[#825700] border-[#E5C185]';
    case 'Risk':
      return 'bg-[#F6E4E1] text-[#A43B36] border-[#DCABA7]';
    case 'Report':
      return 'bg-[#EAF0E9] text-[#2C6475] border-[#D9E2DA]';
    default:
      return 'bg-[#EAF0E9] text-[#52665D] border-[#D9E2DA]';
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
      className={`bg-white border border-[#D9E2DA] rounded-lg overflow-hidden shadow-xs flex flex-col ${className}`}
      data-testid="plnex-global-search-panel"
    >
      {/* 1. Header Bar */}
      {showHeading && (
        <div className="p-4 border-b border-[#D9E2DA] bg-[#F6F7F3] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#EAF0E9] border border-[#D9E2DA] flex items-center justify-center text-[#006B61]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A2B25]">
                Universal Project Search Engine
              </h3>
              <p className="text-[11px] text-[#52665D]">
                Full indexing across Projects, Activities, Events, Evidence, Review Items, Risks, and Reports
              </p>
            </div>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[#52665D] bg-[#EAF0E9] border border-[#D9E2DA] rounded">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
      )}

      {/* 2. Input Box */}
      <div className="p-4 bg-white border-b border-[#D9E2DA] space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#738A80] absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities (PIP-24-001), line numbers, DPRs, risks, evidence certificates..."
            className="w-full pl-9 pr-8 py-2 bg-[#F6F7F3] border border-[#D9E2DA] rounded-md text-xs text-[#1A2B25] placeholder-[#7B8798] focus:outline-none focus:border-[#006B61] focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-[#738A80] hover:text-[#1A2B25]"
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
                    ? 'bg-[#006B61] text-white border-[#006B61]'
                    : 'bg-[#F6F7F3] border-[#D9E2DA] text-[#52665D] hover:bg-[#EAF0E9]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Results Container */}
      <div className="p-3 divide-y divide-[#D9E2DA] max-h-[500px] overflow-y-auto">
        {hasError && (
          <div className="p-6 text-center space-y-2 max-w-sm mx-auto" role="alert">
            <div className="w-8 h-8 rounded-full bg-[#F6E4E1] border border-[#DCABA7] flex items-center justify-center text-[#A43B36] mx-auto">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1A2B25]">
                Search could not be completed.
              </h4>
              <p className="text-[11px] text-[#52665D] mt-0.5 leading-relaxed">
                {errorMessage || 'The search index is temporarily unavailable. Check your query syntax or retry search.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setQuery('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#006B61] hover:bg-[#00524A] text-white text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Search</span>
            </button>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="p-6 text-center" role="status" aria-live="polite">
            <div className="inline-flex items-center gap-2 text-xs text-[#52665D]">
              <Loader2 className="w-4 h-4 animate-spin text-[#006B61] flex-shrink-0" />
              <span className="font-medium text-[#1A2B25]">Searching master index...</span>
            </div>
          </div>
        )}

        {!isLoading && !hasError && query && results.length === 0 && (
          <div className="p-6 text-center space-y-2">
            <Search className="w-6 h-6 text-[#738A80] mx-auto" />
            <p className="text-xs font-bold text-[#1A2B25]">
              No Results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-[11px] text-[#52665D]">
              Try searching with another activity code or entity term.
            </p>
          </div>
        )}

        {!isLoading && !hasError && !query && (
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#52665D] uppercase">
              <span>Recent Searches</span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecentSearches([])}
                  className="text-[10px] text-[#738A80] hover:text-[#A43B36]"
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
                  className="p-2 rounded-lg hover:bg-[#F6F7F3] flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#738A80]" />
                    <span className="font-semibold text-[#1A2B25]">{rec.query}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#738A80]">{rec.relativeTime}</span>
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
                className="p-3 rounded-lg hover:bg-[#EAF0E9]/40 border border-transparent hover:border-[#D9E2DA] transition-colors cursor-pointer flex items-start justify-between gap-3 text-xs"
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
                    <span className="font-mono font-bold text-[#006B61]">{item.id}</span>
                    <span className="text-[11px] text-[#52665D] truncate">{item.project}</span>
                  </div>

                  <h4 className="font-bold text-[#1A2B25]">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-[#52665D] line-clamp-1">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[11px] font-bold text-[#006B61] inline-flex items-center gap-1">
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

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
      return <Layers className="w-3.5 h-3.5 text-[#0F6B68]" />;
    case 'Execution Event':
      return <FileText className="w-3.5 h-3.5 text-[#3B6EA8]" />;
    case 'Evidence':
      return <Camera className="w-3.5 h-3.5 text-[#2E7D5B]" />;
    case 'Review Item':
      return <CheckSquare className="w-3.5 h-3.5 text-[#965E0D]" />;
    case 'Risk':
      return <AlertTriangle className="w-3.5 h-3.5 text-[#A44339]" />;
    case 'Report':
      return <FileBarChart className="w-3.5 h-3.5 text-[#3B6EA8]" />;
    default:
      return <Search className="w-3.5 h-3.5 text-[#52687B]" />;
  }
}

function getEntityTypeBadge(type: SearchResultType) {
  switch (type) {
    case 'Project':
      return 'bg-[#EAF1F5] text-[#0F6B68] border-[#D6E1E9]';
    case 'Activity':
      return 'bg-[#EAF1F5] text-[#0F6B68] border-[#D6E1E9]';
    case 'Execution Event':
      return 'bg-[#EAF1F5] text-[#3B6EA8] border-[#D6E1E9]';
    case 'Evidence':
      return 'bg-[#E5F6EE] text-[#2E7D5B] border-[#B8DCC9]';
    case 'Review Item':
      return 'bg-[#FEF4E6] text-[#8C5311] border-[#F0D4A6]';
    case 'Risk':
      return 'bg-[#FDEEED] text-[#A44339] border-[#E4B0AA]';
    case 'Report':
      return 'bg-[#EAF1F5] text-[#3B6EA8] border-[#D6E1E9]';
    default:
      return 'bg-[#EAF1F5] text-[#52687B] border-[#D6E1E9]';
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
      className={`bg-white border border-[#D6E1E9] rounded-lg overflow-hidden shadow-xs flex flex-col ${className}`}
      data-testid="plnex-global-search-panel"
    >
      {/* 1. Header Bar */}
      {showHeading && (
        <div className="p-4 border-b border-[#D6E1E9] bg-[#F4F7FB] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#EAF1F5] border border-[#D6E1E9] flex items-center justify-center text-[#0F6B68]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A2E42]">
                Universal Project Search Engine
              </h3>
              <p className="text-[11px] text-[#52687B]">
                Full indexing across Projects, Activities, Events, Evidence, Review Items, Risks, and Reports
              </p>
            </div>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[#52687B] bg-[#EAF1F5] border border-[#D6E1E9] rounded">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
      )}

      {/* 2. Input Box */}
      <div className="p-4 bg-white border-b border-[#D6E1E9] space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities (PIP-24-001), line numbers, DPRs, risks, evidence certificates..."
            className="w-full pl-9 pr-8 py-2 bg-[#F4F7FB] border border-[#D6E1E9] rounded-md text-xs text-[#1A2E42] placeholder-[#7B8798] focus:outline-none focus:border-[#0F6B68] focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-[#7B8798] hover:text-[#1A2E42]"
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
                    ? 'bg-[#0F6B68] text-white border-[#0F6B68]'
                    : 'bg-[#F4F7FB] border-[#D6E1E9] text-[#52687B] hover:bg-[#EAF1F5]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Results Container */}
      <div className="p-3 divide-y divide-[#EAF1F5] max-h-[500px] overflow-y-auto">
        {hasError && (
          <div className="p-6 text-center space-y-2 max-w-sm mx-auto" role="alert">
            <div className="w-8 h-8 rounded-full bg-[#FDEEED] border border-[#E4B0AA] flex items-center justify-center text-[#A44339] mx-auto">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1A2E42]">
                Search could not be completed.
              </h4>
              <p className="text-[11px] text-[#52687B] mt-0.5 leading-relaxed">
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

        {isLoading && !hasError && (
          <div className="p-6 text-center" role="status" aria-live="polite">
            <div className="inline-flex items-center gap-2 text-xs text-[#52687B]">
              <Loader2 className="w-4 h-4 animate-spin text-[#0F6B68] flex-shrink-0" />
              <span className="font-medium text-[#1A2E42]">Searching master index...</span>
            </div>
          </div>
        )}

        {!isLoading && !hasError && query && results.length === 0 && (
          <div className="p-6 text-center space-y-2">
            <Search className="w-6 h-6 text-[#7B8798] mx-auto" />
            <p className="text-xs font-bold text-[#1A2E42]">
              No Results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-[11px] text-[#52687B]">
              Try searching with another activity code or entity term.
            </p>
          </div>
        )}

        {!isLoading && !hasError && !query && (
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#52687B] uppercase">
              <span>Recent Searches</span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecentSearches([])}
                  className="text-[10px] text-[#7B8798] hover:text-[#A44339]"
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
                  className="p-2 rounded-lg hover:bg-[#F4F7FB] flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#7B8798]" />
                    <span className="font-semibold text-[#1A2E42]">{rec.query}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7B8798]">{rec.relativeTime}</span>
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
                className="p-3 rounded-lg hover:bg-[#EAF1F5]/40 border border-transparent hover:border-[#D6E1E9] transition-colors cursor-pointer flex items-start justify-between gap-3 text-xs"
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
                    <span className="font-mono font-bold text-[#0F6B68]">{item.id}</span>
                    <span className="text-[11px] text-[#52687B] truncate">{item.project}</span>
                  </div>

                  <h4 className="font-bold text-[#1A2E42]">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-[#52687B] line-clamp-1">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={item.status} size="xs" />
                  <span className="text-[11px] font-bold text-[#0F6B68] inline-flex items-center gap-1">
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

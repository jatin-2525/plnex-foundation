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
      return 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]';
    case 'Risk':
      return 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]';
    case 'Report':
      return 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]';
    default:
      return 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]';
  }
}

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
    return 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]';
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
      className={`bg-white border border-[#D9DEE5] rounded-lg overflow-hidden shadow-xs flex flex-col ${className}`}
      data-testid="plnex-global-search-panel"
    >
      {/* 1. Header Bar */}
      {showHeading && (
        <div className="p-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Universal Project Search Engine
              </h3>
              <p className="text-[11px] text-[#596579]">
                Full indexing across Projects, Activities, Events, Evidence, Review Items, Risks, and Reports
              </p>
            </div>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[#596579] bg-[#F1F3F5] border border-[#D9DEE5] rounded">
            ⌘K / Ctrl+K
          </kbd>
        </div>
      )}

      {/* 2. Input Box */}
      <div className="p-3.5 bg-white border-b border-[#D9DEE5] space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities (PIP-24-001), line numbers, DPRs, risks, evidence certificates..."
            className="w-full pl-9 pr-8 py-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-md text-xs text-[#172033] placeholder-[#7B8798] focus:outline-none focus:border-[#176B87] focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-[#7B8798] hover:text-[#172033]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-[#F1F3F5]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Results Container */}
      <div className="p-3 divide-y divide-[#F1F3F5] max-h-[500px] overflow-y-auto">
        {hasError && (
          <div className="p-6 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-[#B5473C] mx-auto" />
            <p className="text-xs font-bold text-[#172033]">Search Error</p>
            <p className="text-[11px] text-[#596579]">{errorMessage}</p>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="p-6 text-center space-y-2">
            <Loader2 className="w-5 h-5 text-[#176B87] animate-spin mx-auto" />
            <p className="text-xs text-[#596579]">Searching master index...</p>
          </div>
        )}

        {!isLoading && !hasError && query && results.length === 0 && (
          <div className="p-6 text-center space-y-2">
            <Search className="w-6 h-6 text-[#7B8798] mx-auto" />
            <p className="text-xs font-bold text-[#172033]">
              No Results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-[11px] text-[#596579]">
              Try searching with another activity code or entity term.
            </p>
          </div>
        )}

        {!isLoading && !hasError && !query && (
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#596579] uppercase">
              <span>Recent Searches</span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecentSearches([])}
                  className="text-[10px] text-[#7B8798] hover:text-[#B5473C]"
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
                  className="p-2 rounded-lg hover:bg-[#F7F8FA] flex items-center justify-between text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#7B8798]" />
                    <span className="font-semibold text-[#172033]">{rec.query}</span>
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
                className="p-3 rounded-lg hover:bg-[#EDF5F8]/40 border border-transparent hover:border-[#B3CBE0] transition-colors cursor-pointer flex items-start justify-between gap-3 text-xs"
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
                    <span className="font-mono font-bold text-[#176B87]">{item.id}</span>
                    <span className="text-[11px] text-[#596579] truncate">{item.project}</span>
                  </div>

                  <h4 className="font-bold text-[#172033]">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-[#596579] line-clamp-1">{item.description}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border font-mono capitalize ${getStatusBadgeClass(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[11px] font-bold text-[#176B87] inline-flex items-center gap-1">
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

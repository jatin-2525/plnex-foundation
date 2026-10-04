'use client';

import React, { ReactNode } from 'react';
import { Search, X, Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  selectedValue?: string;
}

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  onFilterChange?: (filterId: string, value: string) => void;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  totalResults?: number;
  extraActions?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search by activity ID, name, area or line...',
  filters = [],
  onFilterChange,
  onClearAll,
  hasActiveFilters = false,
  totalResults,
  extraActions,
  className = '',
}: FilterBarProps) {
  return (
    <div
      className={`bg-white border border-[#D9DEE5] rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] placeholder-[#8A94A6] transition-colors outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A94A6] hover:text-[#172033]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center">
            <select
              value={filter.selectedValue || ''}
              onChange={(e) => onFilterChange && onFilterChange(filter.id, e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded-md text-[#172033] focus:border-[#176B87] transition-colors outline-none cursor-pointer"
            >
              <option value="">{filter.label}: All</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && onClearAll && (
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#B5473C] hover:bg-[#FBEFEE] rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Right meta or extra actions */}
      <div className="flex items-center gap-3 justify-between sm:justify-end">
        {totalResults !== undefined && (
          <span className="text-xs text-[#596579] font-mono">
            Showing <strong className="text-[#172033]">{totalResults}</strong> records
          </span>
        )}
        {extraActions}
      </div>
    </div>
  );
}

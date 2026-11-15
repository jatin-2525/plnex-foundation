'use client';

import React, { useState } from 'react';
import { ColumnDef } from '../../types/table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { usePreferences } from '../../context/PreferencesContext';

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  selectable?: boolean;
  selectedIds?: string[];
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onRowClick?: (row: T) => void;
  renderRowActions?: (row: T, index: number) => React.ReactNode;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  loadingMessage = 'Loading table records...',
  emptyTitle = 'No records found in this view',
  emptyDescription = 'No table records match the current filter or query criteria. Adjust your filters or reset to view all entries.',
  emptyAction,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  renderRowActions,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Density preference: comfortable vs compact
  const { shared } = usePreferences();
  const isCompact = shared.density === 'compact';

  if (isLoading) {
    return <LoadingState message={loadingMessage} rows={5} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const handleSort = (colId: string) => {
    if (sortField === colId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(colId);
      setSortDirection('asc');
    }
  };

  // Sort logic
  let sortedData = [...data];
  if (sortField) {
    const col = columns.find((c) => c.id === sortField);
    if (col) {
      sortedData.sort((a, b) => {
        let valA: unknown = col.accessorKey ? (a as any)[col.accessorKey] : col.accessorFn ? col.accessorFn(a) : '';
        let valB: unknown = col.accessorKey ? (b as any)[col.accessorKey] : col.accessorFn ? col.accessorFn(b) : '';

        if (typeof valA === 'string') valA = (valA as string).toLowerCase();
        if (typeof valB === 'string') valB = (valB as string).toLowerCase();

        if (valA! < valB!) return sortDirection === 'asc' ? -1 : 1;
        if (valA! > valB!) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  const allSelected = paginatedData.length > 0 && paginatedData.every((row, idx) => selectedIds.includes(keyExtractor(row, idx)));

  const rowPadding = isCompact ? 'py-1.5 px-3 text-xs' : 'py-3 px-4 text-xs sm:text-sm';
  const headerHeight = isCompact ? 'h-9 text-[11px]' : 'h-11 text-xs';

  return (
    <div className={`bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl overflow-hidden flex flex-col shadow-xs transition-colors ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-sans">
          <thead className="sticky top-0 z-10 bg-[#F6F7F3] dark:bg-[#101815]">
            <tr className={`bg-[#F6F7F3] dark:bg-[#101815] border-b border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] font-semibold uppercase tracking-wider ${headerHeight}`}>
              {selectable && (
                <th className="w-10 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#006B61] focus:ring-[#006B61] cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns
                .filter((c) => !c.hidden)
                .map((col) => {
                  const isSorted = sortField === col.id;
                  return (
                    <th
                      key={col.id}
                      onClick={() => col.sortable && handleSort(col.id)}
                      className={`px-3 py-2.5 font-semibold text-[#1A2B25] dark:text-[#F2F4E9] ${
                        col.sortable ? 'cursor-pointer select-none hover:bg-[#EAF0E9] dark:hover:bg-[#243832]' : ''
                      } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-[#52665D] dark:text-[#B5C1B5]">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3 h-3 opacity-60" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              {renderRowActions && (
                <th className="px-4 py-2.5 font-semibold text-[#1A2B25] dark:text-[#F2F4E9] text-right min-w-[90px]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9]">
            {paginatedData.map((row, index) => {
              const rowKey = keyExtractor(row, startIndex + index);
              const isSelected = selectedIds.includes(rowKey);

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors ${
                    isSelected
                      ? 'bg-[#EAF0E9] dark:bg-[#243832] font-medium border-l-4 border-l-[#006B61] dark:border-l-[#72C6AD]'
                      : 'hover:bg-[#EAF0E9]/60 dark:hover:bg-[#243832]/60 focus-within:bg-[#EAF0E9]/40 dark:focus-within:bg-[#243832]/40 border-l-4 border-l-transparent'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {selectable && (
                    <td
                      className="w-10 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow && onSelectRow(rowKey, e.target.checked)}
                        className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#006B61] focus:ring-[#006B61] cursor-pointer"
                        aria-label={`Select row ${rowKey}`}
                      />
                    </td>
                  )}
                  {columns
                    .filter((c) => !c.hidden)
                    .map((col) => {
                      const value = col.accessorKey
                        ? (row as any)[col.accessorKey]
                        : col.accessorFn
                        ? col.accessorFn(row)
                        : null;

                      return (
                        <td
                          key={col.id}
                          className={`${rowPadding} ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          }`}
                        >
                          {col.cell ? col.cell({ row, value, index: startIndex + index }) : String(value ?? '—')}
                        </td>
                      );
                    })}
                  {renderRowActions && (
                    <td
                      className="px-4 py-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                        {renderRowActions(row, startIndex + index)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#D9E2DA] dark:border-[#3A5146] bg-[#F6F7F3] dark:bg-[#101815] text-xs text-[#52665D] dark:text-[#B5C1B5]">
          <span className="font-mono">
            Page {currentPage} of {totalPages} ({data.length} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF0E9] dark:hover:bg-[#243832] transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF0E9] dark:hover:bg-[#243832] transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

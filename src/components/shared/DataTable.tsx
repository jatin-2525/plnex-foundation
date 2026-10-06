'use client';

import React, { useState } from 'react';
import { ColumnDef } from '../../types/table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching the current query criteria.',
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  if (isLoading) {
    return <LoadingState message="Loading table records..." rows={5} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
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

  return (
    <div className={`bg-white border border-[#D9DEE5] rounded-lg overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-semibold uppercase tracking-wider text-[11px] sm:text-xs">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="rounded border-[#D9DEE5] text-[#176B87] focus:ring-[#176B87] cursor-pointer"
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
                      className={`px-4 py-3 font-semibold text-[#172033] ${
                        col.sortable ? 'cursor-pointer select-none hover:bg-[#F1F3F5]' : ''
                      } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-[#7B8798]">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-[#176B87]" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-[#176B87]" />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9DEE5] text-[#172033] text-[14px]">
            {paginatedData.map((row, index) => {
              const rowKey = keyExtractor(row, startIndex + index);
              const isSelected = selectedIds.includes(rowKey);

              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    isSelected ? 'bg-[#EDF5F8]' : 'hover:bg-[#F1F3F5]/60'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {selectable && (
                    <td
                      className="w-10 px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelectRow && onSelectRow(rowKey, e.target.checked)}
                        className="rounded border-[#D9DEE5] text-[#176B87] focus:ring-[#176B87] cursor-pointer"
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
                          className={`px-4 py-3 ${
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#D9DEE5] bg-[#F7F8FA] text-xs text-[#596579]">
          <span className="font-mono">
            Page {currentPage} of {totalPages} ({data.length} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[#D9DEE5] bg-white text-[#172033] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1F3F5] transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[#D9DEE5] bg-white text-[#172033] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F1F3F5] transition-colors"
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

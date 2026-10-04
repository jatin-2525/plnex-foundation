import React from 'react';
import { PaginationParams, SortParams, FilterParam } from './api';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (props: { row: T; value: unknown; index: number }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  pinned?: 'left' | 'right';
  hidden?: boolean;
}

export interface TableState {
  pagination: PaginationParams;
  sort: SortParams | null;
  filters: FilterParam[];
  selectedRows: string[];
  search: string;
}

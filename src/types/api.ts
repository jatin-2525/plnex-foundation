export type DataState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'empty'
  | 'processing'
  | 'permission-denied';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

export interface AsyncData<T> {
  data: T | null;
  state: DataState;
  error: ApiError | null;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  isProcessing: boolean;
  isPermissionDenied: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'contains'
  | 'between';

export interface FilterParam {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | [number, number];
}

export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: FilterParam[];
  search?: string;
}

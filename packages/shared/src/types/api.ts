// Standard API response envelope — used for ALL responses

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page:       number;
  perPage:    number;
  total:      number;
  totalPages: number;
}

export interface PaginationQuery {
  page?:    number;
  perPage?: number;
  search?:  string;
  sortBy?:  string;
  sortDir?: 'asc' | 'desc';
}

// Helper to build response objects — DRY
export function ok<T>(data: T, message?: string, meta?: PaginationMeta): ApiResponse<T> {
  return { success: true, data, ...(message && { message }), ...(meta && { meta }) };
}

export function fail(code: string, message: string, details?: Record<string, string[]>): ApiError {
  return { success: false, error: { code, message, ...(details && { details }) } };
}

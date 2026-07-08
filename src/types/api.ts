/** Shared API shapes used across modules. Adjust to match your backend contract. */

/** Standard success envelope. Many APIs wrap payloads like this. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/** Standard error body returned by the backend. */
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

/** Pagination envelope for list endpoints. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

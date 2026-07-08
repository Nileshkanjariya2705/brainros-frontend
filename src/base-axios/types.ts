// ** Packages **
import type { AxiosResponse, RawAxiosResponseHeaders, AxiosResponseHeaders } from 'axios';

/**
 * Unified shape returned by EVERY useAxios call (get/post/put/patch/delete).
 * Mirrors the repo's `@libs/common/base-axios/types`. Callers always destructure
 * the same fields regardless of which verb they used.
 */
export interface ExtendedResponse<T = unknown> {
  isSuccess: boolean;
  data: T;
  message?: string;
  status?: number;
  statusText?: string;
  headers?: RawAxiosResponseHeaders | AxiosResponseHeaders;
  response?: AxiosResponse;
  error: string | null;
}

/** Standard error envelope the backend returns. */
export interface ApiErrorResponse {
  message?: string;
  data?: {
    message?: string;
    [key: string]: unknown;
  };
}

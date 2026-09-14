// ** Packages **
import { useCallback, useState } from 'react';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// ** Base Axios **
import { Axios } from '@/base-axios';
import type { ApiErrorResponse, ExtendedResponse } from '@/base-axios/types';

/**
 * useAxios hook family — the app's standard way to call the API.
 *
 * Each hook returns a tuple:  `[callFn, { isLoading, isError, isSuccess }]`
 * `callFn` resolves to an `ExtendedResponse` (never throws) so callers do:
 *
 *   const [post, { isLoading }] = useAxiosPost();
 *   const { data, error } = await post('/auth/login', payload);
 *
 * `data` is already unwrapped from the `{ data: { data } }` envelope.
 * Call fns are wrapped in useCallback so `useEffect([callFn])` is safe.
 */

type RequestState = { isLoading: boolean; isError: boolean; isSuccess: boolean };

/** Builds the success branch of an ExtendedResponse from a raw axios response. */
const toSuccess = <T>(response: AxiosResponse): ExtendedResponse<T> => ({
  isSuccess: true,
  data: response?.data?.data !== undefined ? response?.data?.data : response?.data,
  message: response?.data?.message,
  status: response?.status,
  statusText: response?.statusText,
  headers: response?.headers,
  response,
  error: null,
});

/** Builds the error branch of an ExtendedResponse from a thrown axios error. */
const toError = <T>(error: unknown): ExtendedResponse<T> => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const errorResponse = axiosError?.response?.data;
  const errorData = errorResponse?.data;
  const rawMsg = errorResponse?.message || errorData?.message || (errorResponse as any)?.error;
  
  let formattedMsg: string | undefined;
  if (Array.isArray(rawMsg)) {
    formattedMsg = rawMsg.filter(Boolean).join('. ');
  } else if (typeof rawMsg === 'string' && rawMsg.trim().length > 0) {
    formattedMsg = rawMsg;
  } else if (!axiosError?.response && (axiosError?.code === 'ERR_NETWORK' || (typeof navigator !== 'undefined' && !navigator.onLine))) {
    formattedMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (axiosError?.code === 'ECONNABORTED' || axiosError?.message?.includes('timeout')) {
    formattedMsg = 'The request took too long to complete. Please try again.';
  } else if (axiosError?.message) {
    formattedMsg = axiosError.message;
  } else {
    formattedMsg = String(error);
  }

  return {
    isSuccess: false,
    data: errorData as T,
    message: formattedMsg,
    status: axiosError?.response?.status,
    statusText: axiosError?.response?.statusText,
    headers: axiosError?.response?.headers,
    response: axiosError?.response,
    error: formattedMsg,
  };
};

export const useAxiosGet = (): [
  <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<ExtendedResponse<T>>,
  RequestState,
] => {
  const [state, setState] = useState<RequestState>({
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const getRequest = useCallback(
    async <T = unknown>(
      url: string,
      config: AxiosRequestConfig = {},
    ): Promise<ExtendedResponse<T>> => {
      setState({ isLoading: true, isError: false, isSuccess: false });
      try {
        const response = await Axios.get(url, { ...config });
        setState({ isLoading: false, isError: false, isSuccess: true });
        return toSuccess<T>(response);
      } catch (error) {
        setState({ isLoading: false, isError: true, isSuccess: false });
        return toError<T>(error);
      }
    },
    [],
  );

  return [getRequest, state];
};

export const useAxiosPost = (): [
  <T = unknown>(
    url: string,
    data: object,
    config?: AxiosRequestConfig,
  ) => Promise<ExtendedResponse<T>>,
  RequestState,
] => {
  const [state, setState] = useState<RequestState>({
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const postRequest = useCallback(
    async <T = unknown>(
      url: string,
      data: object,
      config: AxiosRequestConfig = {},
    ): Promise<ExtendedResponse<T>> => {
      setState({ isLoading: true, isError: false, isSuccess: false });
      try {
        const response = await Axios.post(url, data, { ...config });
        setState({ isLoading: false, isError: false, isSuccess: true });
        return toSuccess<T>(response);
      } catch (error) {
        setState({ isLoading: false, isError: true, isSuccess: false });
        return toError<T>(error);
      }
    },
    [],
  );

  return [postRequest, state];
};

export const useAxiosPut = (): [
  <T = unknown>(
    url: string,
    data: object,
    config?: AxiosRequestConfig,
  ) => Promise<ExtendedResponse<T>>,
  RequestState,
] => {
  const [state, setState] = useState<RequestState>({
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const putRequest = useCallback(
    async <T = unknown>(
      url: string,
      data: object,
      config: AxiosRequestConfig = {},
    ): Promise<ExtendedResponse<T>> => {
      setState({ isLoading: true, isError: false, isSuccess: false });
      try {
        const response = await Axios.put(url, data, { ...config });
        setState({ isLoading: false, isError: false, isSuccess: true });
        return toSuccess<T>(response);
      } catch (error) {
        setState({ isLoading: false, isError: true, isSuccess: false });
        return toError<T>(error);
      }
    },
    [],
  );

  return [putRequest, state];
};

export const useAxiosPatch = (): [
  <T = unknown>(
    url: string,
    data: object,
    config?: AxiosRequestConfig,
  ) => Promise<ExtendedResponse<T>>,
  RequestState,
] => {
  const [state, setState] = useState<RequestState>({
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const patchRequest = useCallback(
    async <T = unknown>(
      url: string,
      data: object,
      config: AxiosRequestConfig = {},
    ): Promise<ExtendedResponse<T>> => {
      setState({ isLoading: true, isError: false, isSuccess: false });
      try {
        const response = await Axios.patch(url, data, { ...config });
        setState({ isLoading: false, isError: false, isSuccess: true });
        return toSuccess<T>(response);
      } catch (error) {
        setState({ isLoading: false, isError: true, isSuccess: false });
        return toError<T>(error);
      }
    },
    [],
  );

  return [patchRequest, state];
};

export const useAxiosDelete = (): [
  <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<ExtendedResponse<T>>,
  RequestState,
] => {
  const [state, setState] = useState<RequestState>({
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const deleteRequest = useCallback(
    async <T = unknown>(
      url: string,
      config: AxiosRequestConfig = {},
    ): Promise<ExtendedResponse<T>> => {
      setState({ isLoading: true, isError: false, isSuccess: false });
      try {
        const response = await Axios.delete(url, { ...config });
        setState({ isLoading: false, isError: false, isSuccess: true });
        return toSuccess<T>(response);
      } catch (error) {
        setState({ isLoading: false, isError: true, isSuccess: false });
        return toError<T>(error);
      }
    },
    [],
  );

  return [deleteRequest, state];
};

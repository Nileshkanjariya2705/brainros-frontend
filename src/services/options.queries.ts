import { useQuery } from '@tanstack/react-query';
import { Axios } from '@/base-axios';

export interface AuthOptionItem {
  id: string;
  name: string;
  code?: string;
  [key: string]: any;
}

export interface AuthOptionsData {
  examTargets: AuthOptionItem[];
  boards?: AuthOptionItem[];
  classes?: AuthOptionItem[];
  streams?: AuthOptionItem[];
  states?: AuthOptionItem[];
  languages?: AuthOptionItem[];
  [key: string]: any;
}

export const authOptionKeys = {
  all: ['auth-options'] as const,
};

/**
 * Cached TanStack Query hook for master registration/filter options (/auth/options).
 * Master data is stable and cached for 30 minutes to prevent duplicate requests across screens.
 */
export const useAuthOptionsQuery = () =>
  useQuery<AuthOptionsData>({
    queryKey: authOptionKeys.all,
    queryFn: async (): Promise<AuthOptionsData> => {
      const res = await Axios.get<AuthOptionsData | { data: AuthOptionsData }>('/auth/options');
      const payload = res.data;
      if (payload && 'data' in payload && payload.data) {
        return payload.data;
      }
      return payload as AuthOptionsData;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  });

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

const ALLOWED_TARGET_EXAMS = ['JEE', 'NEET', 'CET'];

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
      const data: AuthOptionsData = (payload && 'data' in payload && payload.data)
        ? payload.data
        : (payload as AuthOptionsData);

      if (data && Array.isArray(data.examTargets)) {
        return {
          ...data,
          examTargets: data.examTargets.filter((t) =>
            ALLOWED_TARGET_EXAMS.includes(t.name?.toUpperCase().trim())
          ),
        };
      }
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  });

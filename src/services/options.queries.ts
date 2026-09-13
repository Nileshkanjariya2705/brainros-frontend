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

const TARGET_ORDER = [
  'JEE',
  'CET',
  'NEET',
  'NEET and JEE',
  'NEET and State CET',
  'JEE and State CET',
  'JEE, NEET and State CET',
];

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
        const filtered = data.examTargets
          .filter((t) =>
            TARGET_ORDER.some((name) => name.toLowerCase() === t.name?.trim().toLowerCase())
          )
          .sort((a, b) => {
            const indexA = TARGET_ORDER.findIndex(
              (name) => name.toLowerCase() === a.name?.trim().toLowerCase()
            );
            const indexB = TARGET_ORDER.findIndex(
              (name) => name.toLowerCase() === b.name?.trim().toLowerCase()
            );
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
          });
        return {
          ...data,
          examTargets: filtered,
        };
      }
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
  });

import { useState, useCallback, useEffect } from 'react';
import { useGetSessionsAPI, useRevokeSessionAPI, useLogoutAllAPI } from '../services';
import type { AuthSession } from '../types/auth.types';

export const useSessions = () => {
  const { getSessionsAPI, isLoading: isLoadingSessions } = useGetSessionsAPI();
  const { revokeSessionAPI, isLoading: isRevoking } = useRevokeSessionAPI();
  const { logoutAllAPI, isLoading: isLoggingOutAll } = useLogoutAllAPI();

  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setError(null);
    const { data, error: apiError } = await getSessionsAPI();
    if (!apiError && data) {
      setSessions(data);
    } else {
      setError(apiError ?? 'Failed to load active sessions.');
    }
  }, [getSessionsAPI]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (sessionId: string) => {
    setError(null);
    const { error: apiError } = await revokeSessionAPI(sessionId);
    if (!apiError) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } else {
      setError(apiError ?? 'Failed to revoke session.');
      return false;
    }
  };

  const revokeAllSessions = async () => {
    setError(null);
    const { error: apiError } = await logoutAllAPI();
    if (!apiError) {
      setSessions([]);
      return true;
    } else {
      setError(apiError ?? 'Failed to revoke all sessions.');
      return false;
    }
  };

  return {
    sessions,
    isLoading: isLoadingSessions || isRevoking || isLoggingOutAll,
    error,
    fetchSessions,
    revokeSession,
    revokeAllSessions,
  };
};

import { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useSessions } from '../hooks/useSessions';
import cn from 'classnames';

interface ActiveSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveSessionsModal = ({ isOpen, onClose }: ActiveSessionsModalProps) => {
  const { sessions, isLoading, error, fetchSessions, revokeSession, revokeAllSessions } =
    useSessions();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    await revokeSession(id);
    setRevokingId(null);
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Globe className="h-5 w-5 text-slate-500" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-5 w-5 text-brand-600" />;
    }
    return <Laptop className="h-5 w-5 text-indigo-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Login Sessions</h2>
              <p className="text-xs text-slate-500">
                Manage and revoke devices currently signed in to your account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="flex items-start space-x-2.5 rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {sessions.length} Active {sessions.length === 1 ? 'Session' : 'Sessions'}
            </span>
            <button
              type="button"
              onClick={fetchSessions}
              disabled={isLoading}
              className="inline-flex items-center space-x-1 text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isLoading && 'animate-spin')} />
              <span>Refresh</span>
            </button>
          </div>

          {sessions.length === 0 && !isLoading ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No other active sessions found</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {session.ipAddress ? `IP: ${session.ipAddress}` : 'Unknown IP'}
                        </p>
                        {index === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">
                        {session.userAgent || 'Unknown browser'}
                      </p>
                      {session.lastActivityAt && (
                        <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                          <Clock className="h-3 w-3 mr-1" />
                          Last active: {new Date(session.lastActivityAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revokingId === session.id}
                    onClick={() => handleRevoke(session.id)}
                    className="shrink-0 text-rose-600 hover:bg-rose-50 border-rose-200 text-xs ml-3"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {revokingId === session.id ? 'Revoking...' : 'Revoke'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/70">
          {sessions.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={revokeAllSessions}
              className="text-rose-700 bg-rose-50 border-rose-300 hover:bg-rose-100 text-xs font-semibold"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Revoke All Other Devices
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="ml-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionsModal;

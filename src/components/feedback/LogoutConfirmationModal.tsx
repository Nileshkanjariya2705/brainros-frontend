// ** Packages **
import React, { useState } from 'react';
import { LogOut, X, AlertTriangle, Shield } from 'lucide-react';
import cn from 'classnames';

// ** Components **
import Button from '@/components/ui/Button';

// ** Hooks & Utils **
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/modules/Auth/auth-access';
import { Axios } from '@/base-axios';
import { toast } from '@/utils/toast';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { user, logout } = useAuth();
  const { activeRoleMeta } = useRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  // Check if there is an active exam saved locally
  const hasActiveExam =
    typeof window !== 'undefined' && Boolean(localStorage.getItem('brainros_active_exam'));

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (onConfirm) {
        await onConfirm();
      } else {
        // Default logout routine: call backend to invalidate session and clear cookies
        try {
          await Axios.post('/auth/logout', {});
        } catch {
          // Continue local cleanup even if network fails
        }
        try {
          localStorage.removeItem('brainros_active_exam');
          localStorage.removeItem('access_token');
          localStorage.removeItem('accessToken');
          sessionStorage.clear();
        } catch {}
        logout();
        toast.success('Logged out successfully.');
      }
    } catch {
      toast.error('An error occurred while logging out.');
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  const displayName =
    user?.studentProfile?.name ||
    user?.name ||
    user?.phone ||
    user?.email?.split('@')[0] ||
    'User';

  const displaySubtitle =
    user?.studentProfile?.studentCode ||
    user?.studentProfile?.studentId ||
    user?.email ||
    activeRoleMeta?.label ||
    'Account Session';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-200 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-5 right-5 rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Visual Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 shadow-md shadow-rose-100 ring-8 ring-rose-50/60 mb-4">
            <LogOut size={28} className="translate-x-0.5" />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-rose-100 text-rose-500 shadow-2xs">
              <Shield size={12} />
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Confirm Logout
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-xs">
            Are you sure you want to log out of your account? You will need to sign in again to access your exams and dashboard.
          </p>
        </div>

        {/* User Identity Preview Card */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-sm shadow-xs shadow-indigo-200">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-black text-slate-900 truncate leading-snug">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold truncate leading-none mt-0.5">
                {displaySubtitle}
              </p>
            </div>
          </div>

          {activeRoleMeta?.label && (
            <span
              className={cn(
                'shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider',
                activeRoleMeta.badgeColor || 'bg-indigo-50 text-indigo-700 border-indigo-200',
              )}
            >
              {activeRoleMeta.label}
            </span>
          )}
        </div>

        {/* Active Exam Warning Banner */}
        {hasActiveExam && (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Active Examination Alert:</span> You have an active test session in progress. Logging out may finalize or end your test attempt.
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-full sm:flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            className="w-full sm:flex-1 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Yes, Log Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;

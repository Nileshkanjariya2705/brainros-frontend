import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRole, getDefaultLandingRoute } from '@/modules/Auth/auth-access';

interface ForbiddenPageProps {
  requiredPermissions?: string[];
  allowedRoles?: string[];
  customMessage?: string;
}

export const ForbiddenPage = ({
  requiredPermissions = [],
  allowedRoles = [],
  customMessage,
}: ForbiddenPageProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activeRole, roles, hasMultipleRoles, switchActiveRole } = useRole();

  const handleReturnHome = () => {
    const targetRoute = getDefaultLandingRoute(
      user
        ? {
            id: user.id,
            roles: user.roles,
            permissions: (user as any).permissions,
            activeRole,
          }
        : null,
    );
    navigate(targetRoute);
  };

  const handleSwitchRole = (role: string) => {
    switchActiveRole(role);
    const targetRoute = getDefaultLandingRoute(
      user
        ? {
            id: user.id,
            roles: user.roles,
            permissions: (user as any).permissions,
            activeRole: role,
          }
        : null,
    );
    navigate(targetRoute);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Status */}
        <div className="relative inline-flex items-center justify-center">
          <div className="h-20 w-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-inner">
            <ShieldAlert className="h-10 w-10 text-rose-600 animate-bounce duration-1000" />
          </div>
          <span className="absolute -bottom-2 px-3 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
            403 FORBIDDEN
          </span>
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Access Restricted by Authorization Policy
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {customMessage ||
              'You do not have the required operational permissions or role clearance to access this module.'}
          </p>
        </div>

        {/* User Context & Missing Permissions Info Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500 border-b border-slate-200/60 pb-2">
            <span>Current Authenticated Role:</span>
            <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {activeRole}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Requested Path:</span>
            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[240px]">
              {location.pathname}
            </span>
          </div>

          {allowedRoles.length > 0 && (
            <div className="flex items-center justify-between text-slate-500 pt-1">
              <span>Permitted Roles:</span>
              <span className="font-bold text-indigo-700">{allowedRoles.join(', ')}</span>
            </div>
          )}

          {requiredPermissions.length > 0 && (
            <div className="flex items-center justify-between text-slate-500 pt-1">
              <span>Required Permission(s):</span>
              <span className="font-mono text-[10px] text-rose-700 font-bold">
                {requiredPermissions.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Multi-Role Switcher Prompt (if available) */}
        {hasMultipleRoles && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-left space-y-2">
            <p className="text-xs font-semibold text-indigo-900">
              You possess multiple roles. Switch your active role perspective:
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => handleSwitchRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    r === activeRole
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleReturnHome}
            className="w-full sm:w-auto shadow-sm"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={logout}
            className="w-full sm:w-auto text-slate-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign in as Different User
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;

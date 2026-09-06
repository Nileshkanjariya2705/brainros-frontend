import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import { GraduationCap, Menu, X, User, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect, type ReactNode } from 'react';

// ** Components **
import Button from '@/components/ui/Button';
import { ActiveExamBanner } from './ActiveExamBanner';
import { LogoutConfirmationModal } from '@/components/feedback/LogoutConfirmationModal';

// ** Hooks & Auth Access **
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/redux/store';
import { setUserData } from '@/redux/slices/authSlice';
import { Axios } from '@/base-axios';
import { useUnreadNotificationCountQuery } from '@/modules/Notification/services/notification.queries';
import {
  useRole,
  useFeatures,
  type MenuGroupConfig,
  ROLE_LABELS,
  getDefaultLandingRoute,
} from '@/modules/Auth/auth-access';

// ** Constants **
import { APP_NAME } from '@config';

// ─── Theme Configuration Interface ─────────────────────────────────────────
export interface RoleThemeConfig {
  /** Sidebar brand gradient classes */
  brandGradient: string;
  /** Active nav link classes */
  activeLinkBg: string;
  activeLinkText: string;
  activeLinkBorder: string;
  /** Header accent */
  headerBorder: string;
  /** Notification bell accent */
  bellAccent: string;
  /** Profile hover accent */
  profileHoverBg: string;
  profileHoverBorder: string;
  /** Brand icon bg */
  brandIconBg: string;
}

export interface RoleLayoutConfig {
  /** Role-specific accent theme classes */
  theme: RoleThemeConfig;
  /** Sidebar menu groups to display */
  menuGroups: MenuGroupConfig[];
  /** Dashboard home path for this role */
  dashboardPath: string;
  /** Notifications path (or null to hide bell) */
  notificationsPath?: string;
  /** Profile path for this role */
  profilePath: string;
  /** Optional sidebar CTA widget */
  ctaWidget?: ReactNode;
  /** Role label override for header */
  roleLabel?: string;
}

// ─── Default Themes ────────────────────────────────────────────────────────
export const ROLE_THEMES: Record<string, RoleThemeConfig> = {
  STUDENT: {
    brandGradient: 'from-indigo-600 to-purple-600',
    activeLinkBg: 'bg-indigo-50',
    activeLinkText: 'text-indigo-700',
    activeLinkBorder: 'border-indigo-100',
    headerBorder: 'border-slate-200',
    bellAccent: 'bg-indigo-600',
    profileHoverBg: 'hover:bg-indigo-50/70',
    profileHoverBorder: 'hover:border-indigo-200',
    brandIconBg: 'bg-gradient-to-br from-indigo-600 to-purple-600',
  },
  ADMIN: {
    brandGradient: 'from-indigo-700 to-slate-800',
    activeLinkBg: 'bg-purple-50',
    activeLinkText: 'text-purple-700',
    activeLinkBorder: 'border-purple-100',
    headerBorder: 'border-slate-200',
    bellAccent: 'bg-purple-600',
    profileHoverBg: 'hover:bg-purple-50/70',
    profileHoverBorder: 'hover:border-purple-200',
    brandIconBg: 'bg-gradient-to-br from-indigo-700 to-slate-800',
  },
  SUPER_ADMIN: {
    brandGradient: 'from-slate-900 to-rose-900',
    activeLinkBg: 'bg-rose-50',
    activeLinkText: 'text-rose-700',
    activeLinkBorder: 'border-rose-100',
    headerBorder: 'border-slate-300',
    bellAccent: 'bg-rose-600',
    profileHoverBg: 'hover:bg-rose-50/70',
    profileHoverBorder: 'hover:border-rose-200',
    brandIconBg: 'bg-gradient-to-br from-slate-900 to-rose-800',
  },
  PARENT: {
    brandGradient: 'from-teal-600 to-indigo-700',
    activeLinkBg: 'bg-teal-50',
    activeLinkText: 'text-teal-700',
    activeLinkBorder: 'border-teal-100',
    headerBorder: 'border-slate-200',
    bellAccent: 'bg-teal-600',
    profileHoverBg: 'hover:bg-teal-50/70',
    profileHoverBorder: 'hover:border-teal-200',
    brandIconBg: 'bg-gradient-to-br from-teal-600 to-indigo-700',
  },
  INSTITUTION_ADMIN: {
    brandGradient: 'from-blue-600 to-indigo-700',
    activeLinkBg: 'bg-blue-50',
    activeLinkText: 'text-blue-700',
    activeLinkBorder: 'border-blue-100',
    headerBorder: 'border-slate-200',
    bellAccent: 'bg-blue-600',
    profileHoverBg: 'hover:bg-blue-50/70',
    profileHoverBorder: 'hover:border-blue-200',
    brandIconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
  },
  INSTITUTION: {
    brandGradient: 'from-blue-600 to-indigo-700',
    activeLinkBg: 'bg-blue-50',
    activeLinkText: 'text-blue-700',
    activeLinkBorder: 'border-blue-100',
    headerBorder: 'border-slate-200',
    bellAccent: 'bg-blue-600',
    profileHoverBg: 'hover:bg-blue-50/70',
    profileHoverBorder: 'hover:border-blue-200',
    brandIconBg: 'bg-gradient-to-br from-blue-600 to-indigo-700',
  },
};

// ─── RoleLayoutShell Component ─────────────────────────────────────────────
interface RoleLayoutShellProps {
  config: RoleLayoutConfig;
}

const RoleLayoutShell = ({ config }: RoleLayoutShellProps) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { roles, activeRole, activeRoleMeta, hasMultipleRoles, switchActiveRole } = useRole();
  const { isEnabled: isFeatureActive } = useFeatures();

  const { theme, menuGroups, dashboardPath, notificationsPath, profilePath, ctaWidget } = config;
  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery(Boolean(notificationsPath));

  // Sync user profile & permissions on mount (only if not already loaded in Redux)
  useEffect(() => {
    if (user?.id) return;
    let active = true;
    const fetchUser = async () => {
      try {
        const res = await Axios.get('/auth/me');
        if (active && res.data) {
          const userData = res.data?.data || res.data;
          dispatch(setUserData(userData));
        }
      } catch {
        // Ignored; axios interceptor handles invalid auth
      }
    };
    fetchUser();
    return () => {
      active = false;
    };
  }, [dispatch, user?.id]);

  // Prevent background scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
      isActive
        ? `${theme.activeLinkBg} ${theme.activeLinkText} font-bold shadow-xs border ${theme.activeLinkBorder}`
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    );

  const handleRoleSelect = (role: string) => {
    switchActiveRole(role);
    setIsRoleMenuOpen(false);
    // Navigate to the new role's default dashboard
    const userContext = user
      ? { id: user.id, roles: [role], permissions: (user as any).permissions, activeRole: role }
      : null;
    const targetRoute = getDefaultLandingRoute(userContext);
    navigate(targetRoute);
  };

  // Reusable navigation menu list items with feature flag & empty group filtering
  const renderNavList = (onItemClick?: () => void) => (
    <div className="space-y-6">
      {menuGroups.map((group) => {
        const visibleItems = group.items.filter((item) => {
          if (item.feature && !isFeatureActive(item.feature)) {
            return false;
          }
          return true;
        });

        // If all items in this group category are disabled, omit the entire group
        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <div key={group.categoryKey} className="space-y-1">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              {group.categoryLabel}
            </p>
            <nav className="space-y-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                  onClick={onItemClick}
                >
                  <item.icon size={17} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.badgeColor || 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ══════════════════════════════════════════════════════════════════════
          1. DESKTOP PERMANENT SIDEBAR (ALWAYS VISIBLE & NON-CLOSABLE >= 1024px)
          ══════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white z-20">
        {/* Sidebar Brand Header */}
        <div
          className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-100 shrink-0 cursor-pointer"
          onClick={() => navigate(dashboardPath)}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme.brandIconBg} shadow-md shadow-indigo-200`}
          >
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tight">
            {APP_NAME}
          </span>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {renderNavList()}
        </div>

        {/* Optional CTA Widget */}
        {ctaWidget && <div className="p-4 border-t border-slate-100 shrink-0">{ctaWidget}</div>}
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          2. MOBILE & TABLET DRAWER SIDEBAR (< 1024px)
          ══════════════════════════════════════════════════════════════════════ */}
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[80vw] bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        )}
      >
        {/* Drawer Header with Close Button */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => {
              navigate(dashboardPath);
              setIsSidebarOpen(false);
            }}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${theme.brandIconBg} shadow-sm shadow-indigo-200`}
            >
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-base font-black text-slate-900 tracking-tight">
              {APP_NAME}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {renderNavList(() => setIsSidebarOpen(false))}
        </div>

        {/* Optional CTA Widget */}
        {ctaWidget && <div className="p-4 border-t border-slate-100 shrink-0">{ctaWidget}</div>}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. MAIN CONTENT COLUMN (HEADER + PAGE VIEWPORT)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header
          className={`sticky top-0 z-20 flex h-16 items-center justify-between ${theme.headerBorder} border-b bg-white/85 backdrop-blur-xl px-4 sm:px-6 shadow-xs`}
        >
          {/* Left: Mobile hamburger + Mobile Brand + Desktop Active Role */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle button (hidden on desktop) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Brand (hidden on desktop because sidebar already displays brand) */}
            <div
              className="flex lg:hidden items-center gap-2 cursor-pointer"
              onClick={() => navigate(dashboardPath)}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${theme.brandIconBg} shadow-sm shadow-indigo-200`}
              >
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="text-base font-black text-slate-900 tracking-tight">
                {APP_NAME}
              </span>
            </div>

            {/* Desktop Active Role Badge / Title */}
            <div className="hidden lg:flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border shadow-2xs ${activeRoleMeta.badgeColor}`}
              >
                {activeRoleMeta.label}
              </span>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Active Role Badge & Switcher */}
            <div className="relative">
              {hasMultipleRoles ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition shadow-2xs"
                    title="Switch Role Perspective"
                  >
                    <span>Role: {activeRoleMeta.label}</span>
                    <ChevronDown size={14} className="text-indigo-600" />
                  </button>

                  {isRoleMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Switch Role View
                      </div>
                      {roles.map((r) => {
                        const meta = ROLE_LABELS[r] || { label: r };
                        return (
                          <button
                            key={r}
                            onClick={() => handleRoleSelect(r)}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition ${
                              r === activeRole
                                ? 'text-indigo-600 font-bold bg-indigo-50/50'
                                : 'text-slate-700'
                            }`}
                          >
                            <span>{meta.label}</span>
                            {r === activeRole && (
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <span
                  className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs ${activeRoleMeta.badgeColor}`}
                >
                  {activeRoleMeta.label}
                </span>
              )}
            </div>

            {/* Notifications Bell */}
            {notificationsPath && (
              <button
                type="button"
                onClick={() => navigate(notificationsPath)}
                className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Pill */}
            <div
              onClick={() => navigate(profilePath)}
              className={`flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 ${theme.profileHoverBg} ${theme.profileHoverBorder} px-3 py-1.5 cursor-pointer transition-all shadow-2xs`}
              title="View & Edit Profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-black text-xs">
                {user?.studentProfile?.name?.charAt(0)?.toUpperCase() ?? <User size={14} />}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.studentProfile?.name ?? user?.phone ?? 'User Profile'}
                </p>
                <p className="text-[10px] text-indigo-600 font-semibold truncate max-w-[120px]">
                  {user?.studentProfile?.studentCode ||
                    user?.studentProfile?.studentId ||
                    activeRoleMeta.label}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutModal(true)}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline ml-1.5">Logout</span>
            </Button>
          </div>
        </header>

        {/* Active Examination In-Progress Banner */}
        <ActiveExamBanner />

        {/* Main Application Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default RoleLayoutShell;

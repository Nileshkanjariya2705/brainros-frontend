// ** Packages **
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import {
  GraduationCap,
  Menu,
  X,
  User,
  Bell,
  LogOut,
  ChevronDown,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ** Components **
import Button from '@/components/ui/Button';
import { LogoutConfirmationModal } from '@/components/feedback/LogoutConfirmationModal';

// ** Hooks & Auth Access **
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/redux/store';
import { setUserData } from '@/redux/slices/authSlice';
import { Axios } from '@/base-axios';
import {
  useRole,
  filterAccessibleMenuGroups,
  type MenuGroupConfig,
  ROLE_LABELS,
  getDefaultLandingRoute,
} from '@/modules/Auth/auth-access';

// ** Constants **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { APP_NAME } from '@config';

const AppLayout = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { roles, activeRole, activeRoleMeta, hasMultipleRoles, switchActiveRole } = useRole();

  // Sync user profile & permissions on mount if user is authenticated
  useEffect(() => {
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
  }, [dispatch]);

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

  // Compute dynamically accessible navigation groups based on permissions & roles
  const accessibleGroups: MenuGroupConfig[] = filterAccessibleMenuGroups(
    user
      ? {
          id: user.id,
          roles: user.roles,
          permissions: (user as any).permissions,
          activeRole: (user as any).activeRole || activeRole,
        }
      : null,
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs border border-indigo-100'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    );

  const handleRoleSelect = (role: string) => {
    switchActiveRole(role);
    setIsRoleMenuOpen(false);
    const userContext = user
      ? { id: user.id, roles: [role], permissions: (user as any).permissions, activeRole: role }
      : null;
    const targetRoute = getDefaultLandingRoute(userContext);
    navigate(targetRoute);
  };

  const renderNavList = (onItemClick?: () => void) => (
    <div className="space-y-6">
      {accessibleGroups.map((group) => (
        <div key={group.categoryKey} className="space-y-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {group.categoryLabel}
          </p>
          <nav className="space-y-1">
            {group.items.map((item) => (
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
      ))}

      {/* Sidebar Practice Daily CTA (only for students/general users) */}
      {accessibleGroups.some((g) => g.categoryKey === 'STUDENT_EXAMS') && (
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-white shadow-md shadow-indigo-100">
          <BookOpen size={22} className="mb-2 text-indigo-200" />
          <h3 className="text-xs font-black uppercase tracking-wide">Practice Daily</h3>
          <p className="mt-1 text-[11px] text-indigo-100 leading-relaxed">
            Consistent practice boosts exam accuracy & scores.
          </p>
          <button
            type="button"
            onClick={() => {
              navigate(PRIVATE_NAVIGATION.availableExams);
              if (onItemClick) onItemClick();
            }}
            className="mt-3 flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors"
          >
            Start Test <ChevronRight size={14} />
          </button>
        </div>
      )}
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
          onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-200">
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
              navigate(PRIVATE_NAVIGATION.dashboard);
              setIsSidebarOpen(false);
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm shadow-indigo-200">
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
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. MAIN CONTENT COLUMN (HEADER + PAGE VIEWPORT)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 backdrop-blur-xl px-4 sm:px-6 shadow-xs">
          {/* Left: Mobile hamburger + Mobile Brand + Desktop Active Role */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle (strictly hidden on desktop) */}
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
              onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm shadow-indigo-200">
                <GraduationCap size={16} className="text-white" />
              </div>
              <span className="text-base font-black text-slate-900 tracking-tight">
                {APP_NAME}
              </span>
            </div>

            {/* Desktop Active Role Badge */}
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
            {/* Active Role Switcher */}
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
            <button
              type="button"
              onClick={() => navigate(PRIVATE_NAVIGATION.notifications)}
              className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* User Profile Pill */}
            <div
              onClick={() => navigate(PRIVATE_NAVIGATION.profile)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/70 hover:border-indigo-200 px-3 py-1.5 cursor-pointer transition-all shadow-2xs"
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

export default AppLayout;

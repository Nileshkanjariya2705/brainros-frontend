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

// ** Hooks & Auth Access **
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/redux/store';
import { setUserData } from '@/redux/slices/authSlice';
import { Axios } from '@/base-axios';
import {
  useRole,
  filterAccessibleMenuGroups,
  type MenuGroupConfig,
} from '@/modules/Auth/auth-access';

// ** Constants **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { APP_NAME } from '@config';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

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
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 backdrop-blur-xl px-4 sm:px-6 shadow-xs">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-md shadow-indigo-200">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight hidden sm:block">
              {APP_NAME}
            </span>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
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
                    {roles.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 transition ${
                          r === activeRole
                            ? 'text-indigo-600 font-bold bg-indigo-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        <span>{r}</span>
                        {r === activeRole && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        )}
                      </button>
                    ))}
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
            onClick={() => navigate(PRIVATE_NAVIGATION.adminNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
          </button>

          {/* User Profile Pill -> Navigates to /profile */}
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
            onClick={logout}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline ml-1.5">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Dynamic Categorized Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 top-16 z-20 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform duration-300 overflow-y-auto lg:static lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          )}
        >
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
                      onClick={() => setIsSidebarOpen(false)}
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
          </div>

          {/* Sidebar Practice Daily CTA (only for students/general users) */}
          {accessibleGroups.some((g) => g.categoryKey === 'STUDENT_EXAMS') && (
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-white shadow-md shadow-indigo-100">
              <BookOpen size={22} className="mb-2 text-indigo-200" />
              <h3 className="text-xs font-black uppercase tracking-wide">Practice Daily</h3>
              <p className="mt-1 text-[11px] text-indigo-100 leading-relaxed">
                Consistent practice boosts exam accuracy & scores.
              </p>
              <button
                onClick={() => {
                  navigate(PRIVATE_NAVIGATION.availableExams);
                  setIsSidebarOpen(false);
                }}
                className="mt-3 flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors"
              >
                Start Test <ChevronRight size={14} />
              </button>
            </div>
          )}
        </aside>

        {/* Sidebar Overlay (mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-slate-900/30 backdrop-blur-xs lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Application Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

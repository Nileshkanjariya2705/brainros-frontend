// ** Packages **
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import {
  LayoutDashboard,
  LogOut,
  FileText,
  History,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Menu,
  X,
  User,
  Bell,
} from 'lucide-react';
import { useState } from 'react';

// ** Components **
import Button from '@/components/ui/Button';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';

// ** Constants **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { APP_NAME } from '@config';

const navItems = [
  {
    label: 'Dashboard',
    to: PRIVATE_NAVIGATION.dashboard,
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Available Exams',
    to: PRIVATE_NAVIGATION.availableExams,
    icon: FileText,
  },
  {
    label: 'Exam History',
    to: PRIVATE_NAVIGATION.myHistory,
    icon: History,
  },
];

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-6 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
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
            <span className="text-lg font-extrabold text-slate-900 tracking-tight hidden sm:block">
              {APP_NAME}
            </span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications Bell */}
          <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs">
              {user?.studentProfile?.name?.charAt(0)?.toUpperCase() ?? <User size={14} />}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.studentProfile?.name ?? user?.phone ?? 'User'}
              </p>
              <p className="text-[10px] text-slate-500">
                {user?.studentProfile?.examTarget ?? 'Student'}
              </p>
            </div>
          </div>

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
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 top-16 z-20 w-64 transform border-r border-slate-200 bg-white p-5 transition-transform duration-300 lg:static lg:translate-x-0',
            isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
          )}
        >
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navLinkClass}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar CTA */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-5 text-white">
            <BookOpen size={24} className="mb-2 text-indigo-200" />
            <h3 className="text-sm font-bold">Practice Daily</h3>
            <p className="mt-1 text-[11px] text-indigo-200 leading-relaxed">
              Consistent practice improves your scores. Start a mock test now!
            </p>
            <button
              onClick={() => {
                navigate(PRIVATE_NAVIGATION.availableExams);
                setIsSidebarOpen(false);
              }}
              className="mt-3 flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors"
            >
              Start Now <ChevronRight size={14} />
            </button>
          </div>
        </aside>

        {/* Sidebar Overlay (mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

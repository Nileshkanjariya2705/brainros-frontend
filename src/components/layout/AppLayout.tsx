// ** Packages **
import { Outlet, NavLink } from 'react-router-dom';
import cn from 'classnames';
import { LayoutDashboard, LogOut } from 'lucide-react';

// ** Components **
import Button from '@/components/ui/Button';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';

// ** Constants / Config **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { APP_NAME } from '@config';

/**
 * Shell for AUTHENTICATED pages: top nav + sidebar + content <Outlet/>.
 * Rendered inside ProtectedRoute, so it only ever shows to logged-in users.
 */
const AppLayout = () => {
  const { user, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium', {
      'bg-brand-50 text-brand-700': isActive,
      'text-gray-600 hover:bg-gray-100': !isActive,
    });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <span className="font-semibold text-gray-900">{APP_NAME}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.name ?? user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-56 border-r bg-white p-4">
          <nav className="space-y-1">
            <NavLink to={PRIVATE_NAVIGATION.dashboard} end className={navLinkClass}>
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

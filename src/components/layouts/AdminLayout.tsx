import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { ADMIN_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const AdminLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.ADMIN,
    menuGroups: ADMIN_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.adminDashboard,
    notificationsPath: PRIVATE_NAVIGATION.adminNotificationsPage,
    profilePath: PRIVATE_NAVIGATION.adminProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default AdminLayout;

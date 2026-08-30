import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { SUPER_ADMIN_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const SuperAdminLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.SUPER_ADMIN,
    menuGroups: SUPER_ADMIN_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.superAdminDashboard,
    notificationsPath: PRIVATE_NAVIGATION.superAdminNotifications,
    profilePath: PRIVATE_NAVIGATION.superAdminProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default SuperAdminLayout;

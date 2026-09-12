import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { MANAGER_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const ManagerLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.MANAGER || ROLE_THEMES.STAFF,
    menuGroups: MANAGER_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.managerDashboard,
    notificationsPath: PRIVATE_NAVIGATION.managerNotifications,
    profilePath: PRIVATE_NAVIGATION.managerProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default ManagerLayout;

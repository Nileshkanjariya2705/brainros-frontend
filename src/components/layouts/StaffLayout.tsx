import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { STAFF_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const StaffLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.STAFF,
    menuGroups: STAFF_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.staffDashboard,
    notificationsPath: PRIVATE_NAVIGATION.staffNotifications,
    profilePath: PRIVATE_NAVIGATION.staffProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default StaffLayout;

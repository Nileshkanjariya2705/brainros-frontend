import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { GENERAL_MANAGER_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const GeneralManagerLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.GENERAL_MANAGER || ROLE_THEMES.STAFF,
    menuGroups: GENERAL_MANAGER_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.generalManagerDashboard,
    notificationsPath: PRIVATE_NAVIGATION.generalManagerNotifications,
    profilePath: PRIVATE_NAVIGATION.generalManagerProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default GeneralManagerLayout;

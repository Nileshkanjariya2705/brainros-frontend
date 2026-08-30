import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { PARENT_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const ParentLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.PARENT,
    menuGroups: PARENT_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.parentDashboardHome,
    notificationsPath: undefined,
    profilePath: PRIVATE_NAVIGATION.parentProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default ParentLayout;

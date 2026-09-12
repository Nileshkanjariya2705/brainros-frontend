import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { OPERATOR_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const OperatorLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.OPERATOR || ROLE_THEMES.STAFF,
    menuGroups: OPERATOR_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.operatorDashboard,
    notificationsPath: PRIVATE_NAVIGATION.operatorNotifications,
    profilePath: PRIVATE_NAVIGATION.operatorProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default OperatorLayout;

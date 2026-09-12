import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { ACCOUNTANT_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const AccountantLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.ACCOUNTANT || ROLE_THEMES.STAFF,
    menuGroups: ACCOUNTANT_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.accountantDashboard,
    notificationsPath: PRIVATE_NAVIGATION.accountantNotifications,
    profilePath: PRIVATE_NAVIGATION.accountantProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default AccountantLayout;

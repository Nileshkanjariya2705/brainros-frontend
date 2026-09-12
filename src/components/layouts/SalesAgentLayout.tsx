import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { SALES_AGENT_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const SalesAgentLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.SALES_AGENT || ROLE_THEMES.INSTITUTION_ADMIN,
    menuGroups: SALES_AGENT_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.salesAgentDashboard,
    notificationsPath: PRIVATE_NAVIGATION.salesAgentNotifications,
    profilePath: PRIVATE_NAVIGATION.salesAgentProfile,
  };

  return <RoleLayoutShell config={config} />;
};

export default SalesAgentLayout;

import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { INSTITUTION_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const InstitutionLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.INSTITUTION_ADMIN || ROLE_THEMES.ADMIN,
    menuGroups: INSTITUTION_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.institutionDashboard,
    notificationsPath: undefined,
    profilePath: PRIVATE_NAVIGATION.institutionProfile,
    roleLabel: 'Institution & B2B',
  };

  return <RoleLayoutShell config={config} />;
};

export default InstitutionLayout;

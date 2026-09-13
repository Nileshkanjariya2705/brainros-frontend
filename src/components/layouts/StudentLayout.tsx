import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import RoleLayoutShell, {
  ROLE_THEMES,
  type RoleLayoutConfig,
} from '@/components/layouts/RoleLayoutShell';
import { STUDENT_MENU_GROUPS } from '@/modules/Auth/auth-access/role-menu-config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const StudentCTA = () => {
  const navigate = useNavigate();
  return (
    <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-white shadow-md shadow-indigo-100">
      <BookOpen size={22} className="mb-2 text-indigo-200" />
      <h3 className="text-xs font-black uppercase tracking-wide">Practice Daily</h3>
      <p className="mt-1 text-[11px] text-indigo-100 leading-relaxed">
        Consistent practice boosts exam accuracy & scores.
      </p>
      <button
        onClick={() => navigate(PRIVATE_NAVIGATION.studentExams)}
        className="mt-3 flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/30 transition-colors"
      >
        Start Test <ChevronRight size={14} />
      </button>
    </div>
  );
};

const StudentLayout = () => {
  const config: RoleLayoutConfig = {
    theme: ROLE_THEMES.STUDENT,
    menuGroups: STUDENT_MENU_GROUPS,
    dashboardPath: PRIVATE_NAVIGATION.studentDashboard,
    notificationsPath: PRIVATE_NAVIGATION.studentNotifications,
    profilePath: PRIVATE_NAVIGATION.studentProfile,
    ctaWidget: <StudentCTA />,
  };

  return <RoleLayoutShell config={config} />;
};

export default StudentLayout;

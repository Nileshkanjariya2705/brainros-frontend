// ** Packages **
import { Link } from 'react-router-dom';

// ** Constants **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-bold text-gray-300">404</h1>
      <p className="text-gray-600">This page could not be found.</p>
      <Link to={PRIVATE_NAVIGATION.dashboard} className="text-brand-600 hover:underline">
        Go home
      </Link>
    </div>
  );
};

export default NotFoundPage;

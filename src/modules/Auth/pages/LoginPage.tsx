// ** Components **
import LoginForm from '../components/LoginForm';

// ** Config **
import { APP_NAME } from '@config';

const LoginPage = () => {
  return (
    <div>
      <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">Welcome back</h1>
      <p className="mb-6 text-center text-sm text-gray-500">Sign in to {APP_NAME}</p>
      <LoginForm />
      <p className="mt-6 text-center text-xs text-gray-400">
        Demo: any email + a 6+ char password (wire to your real API).
      </p>
    </div>
  );
};

export default LoginPage;

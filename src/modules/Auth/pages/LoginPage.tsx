import LoginForm from '../components/LoginForm';
import { APP_NAME } from '@config';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to {APP_NAME} using passwordless OTP login
        </p>
      </div>

      <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
        <LoginForm />
      </div>

      <div className="text-center text-sm text-gray-600">
        <span>New student? </span>
        <Link
          to="/register"
          className="font-semibold text-brand-600 hover:text-brand-500 transition"
        >
          Register Student Profile
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;

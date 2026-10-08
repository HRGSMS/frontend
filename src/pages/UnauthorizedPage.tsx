import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommonButton from '../components/common/Button';

export const UnauthorizedPage: FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs">
        <div className="text-5xl mb-4">🛡️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-sm text-gray-600 mb-6">
          You are currently signed in as{' '}
          <strong className="capitalize text-gray-900">{user?.role || 'Guest'}</strong> (
          {user?.email}). You do not have permission to access this page.
        </p>

        <div className="flex flex-col gap-2">
          <Link to="/dashboard">
            <CommonButton className="w-full">Go to My Dashboard</CommonButton>
          </Link>
          <Link to="/login">
            <CommonButton variant="outline" className="w-full">
              Switch Account
            </CommonButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;

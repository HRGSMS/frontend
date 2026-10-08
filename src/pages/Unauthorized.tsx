import { Link } from 'react-router-dom';
import { homeForRole, getRole } from '../lib/auth-policy';
import { useAuth } from '../context/auth-state';

export const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
          {user && (
            <p className="mt-4 text-sm text-gray-500">
              Signed in as: <span className="font-medium">{user.email}</span> ({user.role})
            </p>
          )}
        </div>
        <div className="space-y-4">
          {getRole(user?.role) && (
            <Link
              to={homeForRole(user?.role)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </Link>
          )}
          {!getRole(user?.role) && (
            <p className="text-sm text-gray-600">
              Ask your hotel administrator to assign a valid role to your account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

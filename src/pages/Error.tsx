import type { FC } from 'react';
import { Link } from 'react-router-dom';

interface ErrorPageProps {
  message?: string;
}

const ErrorPage: FC<ErrorPageProps> = ({ message = 'An unexpected error occurred.' }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <Link
        to="/dashboard"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default ErrorPage;

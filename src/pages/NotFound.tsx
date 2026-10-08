import type { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NotFound: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-[#06829e] to-[#11cac7] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <span className="text-9xl">🗺️</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-[#F9A825] mb-4">Page Not Found</h2>
        <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">
          Oops! The page you're looking for seems to have slid away. Let's get you back to safety.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/dashboard"
            className="bg-[#F9A825] hover:bg-[#C5E1A5] text-[#1B5E20] font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            Go to Home
          </Link>

          <button
            onClick={() => navigate(-1)}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
          >
            Go Back
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-[#A5D6A7]/30">
          <p className="text-white/60 text-sm">Error Code: 404 | Page does not exist</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { getRole, homeForRole, roleLabels } from '../lib/auth-policy';

export function AuthLayout() {
  const { user, signOut, authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const role = getRole(user?.role);
  const { pathname } = useLocation();
  const isFrontDeskWorkspace =
    pathname === '/frontdesk/dashboard' || pathname.includes('/reports');
  async function logout() {
    setPending(true);
    setError(null);
    try {
      await signOut();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign out.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={`min-h-screen bg-gray-50 ${isFrontDeskWorkspace ? 'fd-auth-shell' : ''}`}>
      <header className="border-b bg-white px-4 py-3 text-gray-700">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link to={homeForRole(role)} className="font-semibold text-blue-900">
            SkyNest Hotels
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {role && (
              <Link to="/account" className="text-blue-800 underline">
                Account security
              </Link>
            )}
            <span>
              {user?.name} · {role ? roleLabels[role] : 'Unassigned role'}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={pending}
              aria-busy={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#224846] px-4 py-2 text-sm font-medium text-white hover:bg-[#163734] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#224846] disabled:cursor-wait disabled:opacity-50"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              {pending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>
      {(error || authError) && (
        <p role="alert" className="mx-auto max-w-7xl p-4 text-red-700">
          {error || authError}
        </p>
      )}
      <Outlet />
    </div>
  );
}

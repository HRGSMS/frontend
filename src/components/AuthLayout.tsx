import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { getRole, homeForRole, roleLabels } from '../lib/auth-policy';

export function AuthLayout() {
  const { user, signOut, authError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const role = getRole(user?.role);
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
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
              onClick={() => void logout()}
              disabled={pending}
              className="rounded border px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
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

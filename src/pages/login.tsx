import type { FC, ReactNode, ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import ErrorBanner from '../components/common/ErrorBanner';

const inputClass =
  'w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition';

const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

interface IconInputProps {
  icon: string;
  children: ReactNode;
}

const IconInput: FC<IconInputProps> = ({ icon, children }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
      {icon}
    </span>
    {children}
  </div>
);

export const Login: FC = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: 'frontdesk@skynest.lk', password: 'password123' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const destination = (location.state as any)?.from?.pathname || '/dashboard';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email: form.email, password: form.password });
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (role: UserRole) => {
    switchRole(role);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="bg-[url('/images/login2.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center px-4 py-8 font-[popins]">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xs rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Green top bar */}
        <div className="h-1.5 bg-linear-to-r from-green-500 via-teal-500 to-cyan-600" />

        <div className="px-9 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/images/favicon.svg"
                alt="logo"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span class="text-2xl">🏨</span>';
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sky Nest Hotels</h1>
              <p className="text-xs text-gray-500">Sign in to your account</p>
            </div>
          </div>

          {error && <ErrorBanner message={error} className="mb-4" />}

          {/* Quick Demo Switcher */}
          <div className="mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Quick Role Login (Demo):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('frontdesk')}
                className="py-1 px-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
              >
                Front Desk
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('manager')}
                className="py-1 px-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('admin')}
                className="py-1 px-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Fields */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <IconInput icon="✉️">
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  placeholder="name@skynest.lk"
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </IconInput>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{ marginBottom: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-green-700 hover:text-green-800 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  🔒
                </span>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  placeholder="Enter your password"
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition text-sm"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full h-10 rounded-lg bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white text-sm font-semibold tracking-wide transition shadow-sm"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-gray-500 mt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-700 hover:text-green-800 font-semibold">
                Register as Guest
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

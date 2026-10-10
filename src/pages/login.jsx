import React, { useState } from 'react';

const inputClass =
  'w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition';

const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

const IconInput = ({ icon, children }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
      {icon}
    </span>
    {children}
  </div>
);

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleLogin = async () => {
  if (!form.email.trim() || !form.password) {
    setError('Please enter both your email and password.');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const response = await fetch(
      'http://localhost:4000/api/auth/sign-in/email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || 'Login failed. Check your credentials.',
      );
    }

    window.location.href = '/dashboard';
  } catch (err) {
    setError(err.message || 'Unable to sign in. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-[url('/images/login2.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center px-4 py-4 font-[popins]">
      <div className="w-full max-w-md bg-white/80 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Green top bar */}
        <div className="h-1 bg-linear-to-r from-green-400 via-green-500 to-green-700" />

        <div className="px-9 py-8">
          {/* Header */}
          <div className="flex items-center gap- mb-8">
            <div className="w-8 h-8 flex items-center justify-center ">
              <img
                src="/images/favicon.svg"
                alt="logo"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-xl">⚕️</span>';
                }}
              />
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
              <p className="text-xs text-gray-400 mt-0.5">Hotel management System</p>
            </div>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-4">
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div>
              <label className={labelClass}>Email</label>
              <IconInput icon="✉️">
                <input
                  name="email"
                  type="email"
                  placeholder="abc@email.com"
                  onChange={handleChange}
                  className={inputClass}
                />
              </IconInput>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{ marginBottom: 0 }}>
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                  🔒
                </span>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  onChange={handleChange}
                  className={`${inputClass} pr-10`}
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
              onClick={handleLogin}
              disabled={loading}
              className="mt-1 w-full h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold tracking-wide transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-green-600 hover:text-green-700 font-semibold">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

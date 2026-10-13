import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/auth-state';
import { guestApi, type HotelConfig } from '../../api/guestApi';
import { FloatingContactButtonAuto } from '../../components/FloatingContactButton';

type Tab = 'login' | 'register';

export const GuestAuthPage: React.FC = () => {
  const { signIn, signUpGuest } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') === 'rooms' ? '/rooms' : '/guest/dashboard';

  const [tab, setTab] = useState<Tab>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hotel config from DB
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  useEffect(() => {
    guestApi.getHotelConfig().then(setHotelConfig).catch(() => {});
  }, []);

  /* ── Login form ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  /* ── Register form ── */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: err } = await signIn(loginEmail.trim(), loginPwd);
    if (err) {
      setError(err.message || 'Invalid email or password');
    } else {
      navigate(redirectTo, { replace: true });
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (regPwd !== confirmPwd) { setError('Passwords do not match'); return; }
    if (regPwd.length < 8) { setError('Password must be at least 8 characters'); return; }
    setIsSubmitting(true);
    const { error: err } = await signUpGuest({
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      email:      regEmail.trim(),
      phone_number: phone.trim(),
      password:   regPwd,
    });
    if (err) {
      setError(err.message || 'Could not create account');
    } else {
      navigate(redirectTo, { replace: true });
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 font-sans text-slate-100"
      style={{
        background: 'radial-gradient(ellipse at top, #112133 0%, #0d1824 60%, #07111c 100%)',
      }}
    >
      {/* Logo */}
      <Link to="/rooms" className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-[#1b3b38] border-2 border-[#c5a86a] text-[#c5a86a] font-bold flex items-center justify-center text-sm shadow-lg">
          {(hotelConfig?.hotel_name ?? 'SN').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <span className="block text-lg font-semibold text-white">
            {hotelConfig?.hotel_name ?? 'SkyNest Hotels'}
          </span>
          <span className="block text-[10px] uppercase tracking-[0.3em] text-[#c5a86a]">
            Guest Self-Service Portal
          </span>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-[#122133]/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur">
        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 py-4 text-sm font-semibold tracking-wide transition-colors ${
                tab === t
                  ? 'bg-[#1b3b38] text-[#c5a86a] border-b-2 border-[#c5a86a]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'login' ? 'Guest Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="p-7">
          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/40 rounded-xl text-red-200 text-xs">
              ⚠ {error}
            </div>
          )}

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  id="guest-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  id="guest-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginPwd}
                  onChange={(e) => setLoginPwd(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#c5a86a] hover:bg-[#d8bd80] text-[#0d1824] font-bold text-sm transition shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in…' : 'Sign In to Guest Portal'}
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                Don't have an account?{' '}
                <button type="button" onClick={() => setTab('register')} className="text-[#c5a86a] underline">
                  Create one free
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">First Name</label>
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    maxLength={20}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Amara"
                    disabled={isSubmitting}
                    className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Name</label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    maxLength={20}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Perera"
                    disabled={isSubmitting}
                    className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  maxLength={255}
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password (min. 8 chars)</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  value={regPwd}
                  onChange={(e) => setRegPwd(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-[#0d1824] border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#c5a86a] focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#c5a86a] hover:bg-[#d8bd80] text-[#0d1824] font-bold text-sm transition shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account…' : 'Create My Guest Account'}
              </button>
              <p className="text-center text-xs text-slate-500 pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-[#c5a86a] underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Staff portal separator */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <Link
              to="/login"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              🔒 Staff Portal Login (Hotel Employees)
            </Link>
          </div>
        </div>
      </div>

      <FloatingContactButtonAuto />
    </div>
  );
};

export default GuestAuthPage;

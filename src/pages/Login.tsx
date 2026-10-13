import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-state';
import { guestApi, type BranchItem, type HotelConfig } from '../api/guestApi';
import './Login.css';

// SVG Icons for password visibility toggle
function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export const Login = () => {
  const { signIn, signUpGuest, isLoading, authError, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine initial tab & redirect destination
  const isRegisterParam = searchParams.get('tab') === 'register' || searchParams.get('mode') === 'register';
  const [tab, setTab] = useState<'signin' | 'register'>(isRegisterParam ? 'register' : 'signin');
  const redirectTo = searchParams.get('redirect') === 'rooms' ? '/rooms' : null;

  // Sign in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branch, setBranch] = useState('Colombo');
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest registration state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    Promise.all([
      guestApi.getBranches().catch(() => []),
      guestApi.getHotelConfig().catch(() => null),
    ]).then(([branchList, cfg]) => {
      if (branchList.length > 0) {
        setBranches(branchList);
        setBranch(branchList[0].location_city || branchList[0].name);
      }
      if (cfg) {
        setHotelConfig(cfg);
      }
    });
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn(email.trim(), password);
    const { error: signInError } = result;

    if (signInError) {
      setError(signInError.message || 'Invalid email or password');
    } else if (redirectTo) {
      navigate(redirectTo, { replace: true });
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    const result = await signUpGuest({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: regEmail.trim(),
      phone_number: phone.trim(),
      password: regPassword,
    });

    const { error: signUpError } = result;
    if (signUpError) {
      setError(signUpError.message || 'Could not create guest account');
    } else {
      navigate(redirectTo ?? '/guest/dashboard', { replace: true });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="sn-login-page">
      {/* Top Navigation Bar */}
      <header className="sn-login-header">
        <Link to="/" className="sn-brand-lockup">
          <div className="sn-monogram">
            {(hotelConfig?.hotel_name ?? 'SN').slice(0, 2).toUpperCase()}
          </div>
          <span className="sn-brand-text">
            {hotelConfig?.hotel_name ?? 'SkyNest Hotels'}
          </span>
        </Link>
        <nav className="sn-nav-links" aria-label="Portal Navigation">
          <Link to="/rooms" className="sn-nav-link" style={{ fontWeight: 600, color: '#fef08a' }}>
            Browse Rooms
          </Link>
          <a href="#story" onClick={(e) => e.preventDefault()} className="sn-nav-link">
            Our Story
          </a>
          <a href="#experiences" onClick={(e) => e.preventDefault()} className="sn-nav-link">
            Experiences
          </a>
          <a href="#contact" onClick={(e) => e.preventDefault()} className="sn-nav-link">
            Contact
          </a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="sn-login-main">
        {/* Subtle Luxury Background Watermark */}
        <div className="sn-bg-watermark" aria-hidden="true">
          HOTEL SKYNEST
        </div>

        {/* Frosted Glass Unified Login Card */}
        <section className="sn-login-card" aria-labelledby="sn-login-heading">
          <button
            type="button"
            className="sn-card-close"
            aria-label="Close"
            onClick={() => {
              setEmail('');
              setPassword('');
              setError(null);
            }}
          >
            ×
          </button>

          <div className="sn-card-header">
            <h1 id="sn-login-heading" className="sn-card-title">
              {hotelConfig?.hotel_name ?? 'SkyNest Hotel'} Login
            </h1>
            <p className="sn-card-subtitle">
              Access your guest reservations or hotel management portal
            </p>
          </div>

          {/* Tab Selector: Sign In vs Guest Registration */}
          <div className="sn-tabs-row" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              className={`sn-tab-btn ${tab === 'signin' ? 'is-active' : ''}`}
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'register'}
              className={`sn-tab-btn ${tab === 'register' ? 'is-active' : ''}`}
              onClick={() => {
                setTab('register');
                setError(null);
              }}
            >
              Guest Registration
            </button>
          </div>

          {/* Session / System Auth Error */}
          {authError && !authError.toLowerCase().includes('failed to fetch') && (
            <div role="alert" className="sn-alert-warn">
              <p>{authError}</p>
              <button
                type="button"
                onClick={() => void refreshSession()}
                className="sn-retry-btn"
              >
                Retry session check
              </button>
            </div>
          )}

          {/* Validation Error Message */}
          {error && (
            <div className="sn-alert-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── TAB 1: SIGN IN FORM (Staff & Guests) ── */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} noValidate={false}>
              {/* Email / ID */}
              <div className="sn-form-group">
                <label htmlFor="user-email" className="sn-label">
                  EMAIL / USER ID
                </label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sn-input"
                  placeholder="Enter your email or staff ID"
                  disabled={isSubmitting}
                />
              </div>

              {/* Password with Show/Hide toggle */}
              <div className="sn-form-group">
                <label htmlFor="user-password" className="sn-label">
                  PASSWORD
                </label>
                <div className="sn-password-wrap">
                  <input
                    id="user-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="sn-input"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="sn-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Branch Selection (Staff) */}
              <div className="sn-form-group">
                <label htmlFor="branch-select" className="sn-label">
                  BRANCH SELECTION (STAFF)
                </label>
                <div className="sn-select-wrap">
                  <select
                    id="branch-select"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="sn-select"
                    disabled={isSubmitting}
                  >
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.public_id} value={b.location_city || b.name}>
                          {b.name}
                        </option>
                      ))
                    ) : (
                      <option value="Colombo">Colombo</option>
                    )}
                  </select>
                  <div className="sn-select-arrow" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="sn-form-meta">
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact front desk or hotel administration for credential assistance.');
                  }}
                  className="sn-forgot-link"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="sn-submit-btn"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Signing in…</span>
                  </>
                ) : (
                  'SIGN IN'
                )}
              </button>

              <div className="sn-switch-link-wrap">
                <button
                  type="button"
                  className="sn-switch-link-btn"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                >
                  New guest? Create an account →
                </button>
              </div>
            </form>
          )}

          {/* ── TAB 2: GUEST REGISTRATION FORM ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} noValidate={false}>
              <div className="sn-form-row">
                <div className="sn-form-group">
                  <label htmlFor="reg-first-name" className="sn-label">
                    FIRST NAME
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="sn-input"
                    placeholder="John"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="sn-form-group">
                  <label htmlFor="reg-last-name" className="sn-label">
                    LAST NAME
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="sn-input"
                    placeholder="Doe"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="sn-form-group">
                <label htmlFor="reg-email" className="sn-label">
                  EMAIL ADDRESS
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="sn-input"
                  placeholder="john.doe@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="sn-form-group">
                <label htmlFor="reg-phone" className="sn-label">
                  PHONE NUMBER
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="sn-input"
                  placeholder="+94 77 123 4567"
                  disabled={isSubmitting}
                />
              </div>

              {/* Password with Show/Hide toggle */}
              <div className="sn-form-group">
                <label htmlFor="reg-password" className="sn-label">
                  PASSWORD (MIN 8 CHARACTERS)
                </label>
                <div className="sn-password-wrap">
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="sn-input"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="sn-password-toggle"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm Password with Show/Hide toggle */}
              <div className="sn-form-group">
                <label htmlFor="reg-confirm-password" className="sn-label">
                  CONFIRM PASSWORD
                </label>
                <div className="sn-password-wrap">
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="sn-input"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="sn-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="sn-submit-btn"
                style={{ marginTop: '8px' }}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>Creating Account…</span>
                  </>
                ) : (
                  'CREATE GUEST ACCOUNT'
                )}
              </button>

              <div className="sn-switch-link-wrap">
                <button
                  type="button"
                  className="sn-switch-link-btn"
                  onClick={() => {
                    setTab('signin');
                    setError(null);
                  }}
                >
                  Already have an account? Sign in →
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      {/* Bottom Luxury Curved Section */}
      <footer className="sn-login-footer">
        <p className="sn-footer-slogan">
          {hotelConfig?.hotel_tagline
            ? hotelConfig.hotel_tagline.toUpperCase()
            : 'DEDICATED TO PROVIDING THE HIGHEST LEVEL OF COMFORT AND SERENITY ACROSS SRI LANKA.'}
        </p>
        <div className="sn-branches-row">
          {branches.length > 0 ? (
            branches.map((b) => (
              <span key={b.public_id} className="sn-branch-pill">
                {(b.location_city || b.name).toUpperCase()}
              </span>
            ))
          ) : (
            <>
              <span className="sn-branch-pill">COLOMBO</span>
              <span className="sn-branch-pill">KANDY</span>
              <span className="sn-branch-pill">GALLE</span>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Login;

import { useState } from 'react';
import { useAuth } from '../context/auth-state';
import './Login.css';

export const Login = () => {
  const { signIn, isLoading, authError, refreshSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('Colombo');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn(email, password);
    const { error: signInError } = result;

    if (signInError) {
      setError(signInError.message || 'Invalid email or password');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="sn-login-page">
      {/* Top Navigation Bar */}
      <header className="sn-login-header">
        <div className="sn-brand-lockup">
          <div className="sn-monogram">SN</div>
          <span className="sn-brand-text">SkyNest Hotels</span>
        </div>
        <nav className="sn-nav-links" aria-label="Portal Navigation">
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

        {/* Frosted Glass Staff Login Modal */}
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
              Staff Login
            </h1>
            <p className="sn-card-subtitle">Access the SkyNest Management Portal</p>
          </div>

          {/* Session / System Auth Error */}
          {authError && (
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

          {/* Sign In Validation Error */}
          {error && (
            <div className="sn-alert-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate={false}>
            {/* Staff ID / Email */}
            <div className="sn-form-group">
              <label htmlFor="staff-email" className="sn-label">
                STAFF ID / EMAIL
              </label>
              <input
                id="staff-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sn-input"
                placeholder="Enter your ID"
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="sn-form-group">
              <label htmlFor="staff-password" className="sn-label">
                PASSWORD
              </label>
              <input
                id="staff-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="sn-input"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            {/* Branch Selection */}
            <div className="sn-form-group">
              <label htmlFor="branch-select" className="sn-label">
                BRANCH SELECTION
              </label>
              <div className="sn-select-wrap">
                <select
                  id="branch-select"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="sn-select"
                  disabled={isSubmitting}
                >
                  <option value="Colombo">Colombo</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
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
                  alert('Please contact your hotel system administrator to reset staff credentials.');
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
          </form>
        </section>
      </main>

      {/* Bottom Luxury Curved Section */}
      <footer className="sn-login-footer">
        <p className="sn-footer-slogan">
          DEDICATED TO PROVIDING THE HIGHEST LEVEL OF COMFORT AND SERENITY ACROSS SRI LANKA.
        </p>
        <div className="sn-branches-row">
          <span className="sn-branch-pill">COLOMBO</span>
          <span className="sn-branch-pill">KANDY</span>
          <span className="sn-branch-pill">GALLE</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;

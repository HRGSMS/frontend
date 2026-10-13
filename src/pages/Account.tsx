import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FrontDeskIcon as Icon } from '../components/FrontDeskIcon';
import { homeForRole, getRole, roleLabels } from '../lib/auth-policy';
import './Account.css';
import { authClient } from '../lib/auth-client';
import { useAuth } from '../context/auth-state';

export default function Account() {
  const { user, refreshSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const role = getRole(user?.role);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (
      newPassword.length < 5 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^a-zA-Z0-9\s]/.test(newPassword)
    ) {
      setError(
        'Use at least 5 characters, including an uppercase letter, number and special character.',
      );
      return;
    }
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a password different from your current password.');
      return;
    }
    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.message || 'Unable to change password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setSuccess(true);
      await refreshSession();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to change password.');
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="account-page">
      <div className="account-container">
        <Link to={homeForRole(user?.role)} className="account-back">
          ← Back to dashboard
        </Link>
        <header className="account-heading">
          <span className="account-heading-icon">
            <Icon name="shield" size={24} />
          </span>
          <div>
            <p className="account-eyebrow">YOUR ACCOUNT</p>
            <h1>Account security</h1>
            <p>Keep your SkyNest account secure.</p>
          </div>
        </header>
        <div className="account-grid">
          <aside className="account-profile" aria-label="Signed-in account">
            <span className="account-avatar">
              {user?.name?.trim().charAt(0).toUpperCase() || 'S'}
            </span>
            <h2>{user?.name || 'Your account'}</h2>
            <p className="account-email">{user?.email}</p>
            {role && <span className="account-role">{roleLabels[role]}</span>}
            <div className="account-session-note">
              <Icon name="shield" size={19} />
              <p>Changing your password signs you out of other sessions.</p>
            </div>
          </aside>
          <form
            onSubmit={(event) => void submit(event)}
            className="account-form"
            aria-labelledby="account-password-title"
            aria-busy={pending}
          >
            <h2 id="account-password-title">Change password</h2>
            <p id="account-password-help" className="account-help">
              Use at least 5 characters with an uppercase letter, number and special character.
            </p>
            {error && (
              <p role="alert" className="account-message account-error">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="account-message account-success">
                Your password has been changed.
              </p>
            )}
            {[
              {
                id: 'current-password',
                label: 'Current password',
                value: currentPassword,
                set: setCurrentPassword,
                autoComplete: 'current-password',
              },
              {
                id: 'new-password',
                label: 'New password',
                value: newPassword,
                set: setNewPassword,
                autoComplete: 'new-password',
              },
              {
                id: 'confirm-password',
                label: 'Confirm new password',
                value: confirmation,
                set: setConfirmation,
                autoComplete: 'new-password',
              },
            ].map((field) => (
              <div key={field.id} className="account-field">
                <label htmlFor={field.id} className="account-label">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={showPasswords ? 'text' : 'password'}
                  aria-describedby={
                    field.id === 'new-password' ? 'account-password-help' : undefined
                  }
                  autoComplete={field.autoComplete}
                  required
                  disabled={pending}
                  value={field.value}
                  onChange={(event) => field.set(event.target.value)}
                  className="account-input"
                />
              </div>
            ))}
            <label className="account-show-passwords">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(event) => setShowPasswords(event.target.checked)}
                disabled={pending}
              />
              Show passwords
            </label>
            <div className="account-form-actions">
              <button type="submit" disabled={pending} className="account-submit">
                {pending ? 'Changing password…' : 'Change password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

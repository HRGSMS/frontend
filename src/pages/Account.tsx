import { useState, type FormEvent } from 'react';
import { authClient } from '../lib/auth-client';
import { useAuth } from '../context/auth-state';

export default function Account() {
  const { user, refreshSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (
      newPassword.length < 10 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^a-zA-Z0-9\s]/.test(newPassword)
    ) {
      setError(
        'Use at least 10 characters, including an uppercase letter, number and special character.',
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
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Account security</h1>
      <p className="mt-2 text-gray-600">{user?.email}</p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        <h2 className="text-lg font-medium">Change password</h2>
        <p className="text-sm text-gray-600">
          Use at least 10 characters with an uppercase letter, number and special character. Other
          sessions will be signed out.
        </p>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-green-700">
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
          <div key={field.id}>
            <label htmlFor={field.id} className="block text-sm font-medium">
              {field.label}
            </label>
            <input
              id={field.id}
              type="password"
              autoComplete={field.autoComplete}
              required
              disabled={pending}
              value={field.value}
              onChange={(event) => field.set(event.target.value)}
              className="mt-1 w-full rounded border p-2 focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </div>
        ))}
        <button
          disabled={pending}
          className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Changing password…' : 'Change password'}
        </button>
      </form>
    </main>
  );
}

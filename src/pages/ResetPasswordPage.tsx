import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../api/apiClient';
import CommonButton from '../components/common/Button';
import ErrorBanner from '../components/common/ErrorBanner';
import FormInput from '../components/common/FormInput';

const ResetPasswordPage: FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Use at least 8 characters, including one uppercase letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('This reset link is missing its token or has expired.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setIsComplete(true);
    } catch (requestError) {
      const mockAuthEnabled =
        import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
      if (mockAuthEnabled && axios.isAxiosError(requestError) && !requestError.response) {
        setIsComplete(true);
      } else {
        setError('Unable to reset your password. Request a new reset link and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Choose a new password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your new password must meet the account security requirements.
        </p>

        {error && <ErrorBanner message={error} className="mt-5" />}
        {isComplete ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-green-800">Your password has been updated.</p>
            <Link to="/login" className="text-sm font-semibold text-cyan-700 hover:underline">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormInput
              label="New password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <FormInput
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <CommonButton type="submit" isLoading={isSubmitting} className="w-full">
              Update password
            </CommonButton>
          </form>
        )}
      </section>
    </main>
  );
};

export default ResetPasswordPage;

import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormInput from '../components/common/FormInput';
import CommonButton from '../components/common/Button';

export const ForgotPasswordPage: FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="bg-[url('/images/login2.jpg')] bg-cover bg-center min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xs rounded-2xl border border-gray-200 shadow-xl p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h1>
        <p className="text-xs text-gray-500 mb-6">
          Enter your registered email and we'll send you instructions to reset your password.
        </p>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h2 className="text-base font-bold text-gray-900">Check your inbox</h2>
            <p className="text-xs text-gray-600">
              We have sent a reset password link to <strong>{email}</strong>.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <CommonButton variant="outline" className="w-full">
                  Back to Sign In
                </CommonButton>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Email Address"
              type="email"
              placeholder="name@skynest.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <CommonButton type="submit" className="w-full">
              Send Reset Link
            </CommonButton>
            <div className="text-center mt-3">
              <Link to="/login" className="text-xs text-gray-500 hover:text-gray-900">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

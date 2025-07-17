import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OpenForumLogo from '@/assets/open-forum-logo.png';
import { RegisterRequest } from '@/features/auth/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { authApi } from '../services';
import { GoogleOAuthButton } from './OAuthButtons';

const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    fullName: '',
  });

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'username' ? value.toLowerCase().trim() : value,
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate password confirmation
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.register(formData);
      setSuccessMessage(response.message);
      setIsSuccess(true);
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative my-5 flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white px-6 py-8">
      <div className="bg-primary absolute top-0 right-0 h-1.5 w-full rounded-t-2xl" />

      {/* Success State */}
      {isSuccess ? (
        <div className="animate-fade-in flex flex-col items-center justify-center py-8 text-center">
          {/* Success Icon with Animation */}
          <div className="animate-bounce-once mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="mb-2 text-xl font-semibold text-gray-800">Welcome to Open Forum!</h2>
          <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-600">{successMessage}</p>

          {/* Action Button */}
          <MainButton
            onClick={() => navigate('/login')}
            fullWidth
            size="lg"
            className="mb-4 transform transition-transform hover:scale-101"
          >
            Continue to Login
          </MainButton>

          {/* Additional Info */}
          <p className="text-xs text-gray-500">
            You can now participate in discussions and connect with the Open Forum community.
          </p>
        </div>
      ) : (
        <>
          {/* Logo */}
          <div className="flex justify-center gap-4 py-5">
            <img src={OpenForumLogo} alt="Open Forum Logo" className="h-20 w-20" />
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-gray-600">OPEN</h1>
              <h1 className="text-primary text-4xl font-bold">FORUM</h1>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-xs font-semibold text-gray-600 md:text-sm">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="focus:ring-primary-dark w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-1 focus:outline-none"
                placeholder="johndoe123"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-xs font-semibold text-gray-600 md:text-sm">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="focus:ring-primary-dark w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-1 focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-600 md:text-sm">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="focus:ring-primary-dark w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-1 focus:outline-none"
                  placeholder="StrongP@ssw0rd"
                  required
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 md:text-sm">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleInputChange}
                  className={`focus:ring-primary-dark w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none ${
                    confirmPassword && formData.password !== confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={toggleConfirmPasswordVisibility}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}
                </button>
              </div>
              {confirmPassword && formData.password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <div className="mt-6">
              <MainButton type="submit" isLoading={isLoading} fullWidth size="lg">
                Register
              </MainButton>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary hover:text-primary-dark font-semibold"
              >
                Login here
              </button>
            </p>
          </div>

          {/* OAuth Section */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or register with</span>
              </div>
            </div>

            <div className="space-y-3">
              <GoogleOAuthButton />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterForm;

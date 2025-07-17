import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import OpenForumLogo from '@/assets/open-forum-logo.png';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginRequest } from '@/features/auth/types';
import { UserRole } from '@/features/users/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { GoogleOAuthButton } from './OAuthButtons';

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });

  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'username' ? value.toLowerCase().trim() : value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(formData);

      if (user.role === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="relative flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white px-6 py-8">
      <div className="bg-primary absolute top-0 right-0 h-1.5 w-full rounded-t-2xl" />

      {/* Logo */}
      <div className="flex justify-center gap-4 py-5">
        <img src={OpenForumLogo} alt="Open Forum Logo" className="h-20 w-20" />
        <div className="flex flex-col justify-center">
          <h1 className="text-sm font-bold text-gray-600">Open</h1>
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
      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="Type here"
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
              placeholder="Type here"
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
        </div>
        <div className="mt-6">
          <MainButton type="submit" isLoading={isLoading} fullWidth size="lg">
            Login
          </MainButton>
        </div>
      </form>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-primary hover:text-primary-dark font-semibold"
          >
            Register here
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
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="space-y-3">
          <GoogleOAuthButton />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

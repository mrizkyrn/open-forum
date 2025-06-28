import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginRequest } from '@/features/auth/types';
import { UserRole } from '@/features/users/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    <div className="relative flex w-full max-w-sm flex-col gap-7 rounded-2xl bg-white px-6 py-8">
      <div className="bg-primary absolute top-0 right-0 h-1.5 w-full rounded-t-2xl" />

      {/* Logo */}
      <div className="flex justify-center gap-4 py-5">
        <img src="src/assets/logo-upnvj.png" alt="UPNVJ Logo" className="h-20 w-20" />
        <div className="flex flex-col justify-center">
          <h1 className="text-sm font-bold text-gray-600">UPNVJ</h1>
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
          <label htmlFor="username" className="block text-xs font-semibold text-gray-600">
            NIM
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="focus:ring-primary-dark w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-1 focus:outline-none"
            placeholder="Type here"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-xs font-semibold text-gray-600">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="focus:ring-primary-dark w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-1 focus:outline-none"
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
          <MainButton type="submit" isLoading={isLoading} fullWidth size="xl">
            Login
          </MainButton>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;

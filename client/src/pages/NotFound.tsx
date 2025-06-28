import { ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import MainButton from '@/shared/components/ui/buttons/MainButton';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="relative">
          <h1 className="from-primary bg-gradient-to-r to-blue-600 bg-clip-text text-9xl font-extrabold tracking-tighter text-transparent">
            404
          </h1>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-medium text-gray-900">Page not found</h2>
          <p className="mx-auto max-w-sm text-sm text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-3 pt-6">
          <MainButton
            variant="outline"
            size="md"
            leftIcon={<ArrowLeft size={16} />}
            fullWidth
            onClick={() => window.history.back()}
          >
            Go back
          </MainButton>

          <Link to="/" className="w-full">
            <MainButton variant="primary" size="md" leftIcon={<Home size={16} />} fullWidth>
              Home
            </MainButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

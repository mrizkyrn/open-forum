import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-primary-light text-9xl font-extrabold">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-light">
            Page Not Found
          </h2>
          <p className="mt-2 text-base text-lighter">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <Link
            to="/"
            className="hover:bg-primary-dark bg-primary-light inline-flex items-center justify-center rounded-md border border-transparent px-5 py-3 text-base font-medium text-white"
          >
            Go back home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Go back to previous page
          </button>
        </div>

        <div className="pt-6">
          <p className="text-sm text-gray-500">
            If you think this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

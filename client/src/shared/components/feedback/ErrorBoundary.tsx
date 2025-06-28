import { Component, ErrorInfo, ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                  <h2 className="mb-4 text-3xl font-extrabold text-gray-900">Something went wrong</h2>
                  <p className="mb-6 text-red-600">{this.state.error?.message || 'An unexpected error occurred'}</p>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="bg-primary-light hover:bg-primary-dark focus:ring-primary-light flex w-full cursor-pointer justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = () => {
  const error = useRouteError();

  let errorMessage = 'Something went wrong';
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorMessage = error.data?.message || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="mb-2 text-3xl font-extrabold text-gray-900">{statusCode}</h2>
              <h3 className="mb-4 text-xl font-medium text-gray-700">Oops! An error occurred</h3>
              {statusCode === 500 ? (
                <p className="mb-6 text-red-600">Something went wrong on our end</p>
              ) : (
                <p className="mb-6 text-gray-600">{errorMessage}</p>
              )}
              <button
                onClick={() => (window.location.href = '/')}
                className="bg-primary-light hover:bg-primary-dark focus:ring-primary-light flex w-full cursor-pointer justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryClass;

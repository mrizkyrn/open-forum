interface ErrorFetchingProps {
  text?: string;
  onRetry: () => void;
}

const ErrorFetching = ({ text, onRetry }: ErrorFetchingProps) => {
  return (
    <div className="rounded-lg bg-red-50 p-4 text-center">
      <p className="text-red-600">{text || 'Failed to fetch data'}</p>
      <button onClick={onRetry} className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
        Try Again
      </button>
    </div>
  );
};

export default ErrorFetching;

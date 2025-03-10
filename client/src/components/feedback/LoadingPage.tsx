const LoadingPage: React.FC = () => {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="border-t-primary-light h-12 w-12 animate-spin rounded-full border-4 border-gray-200"></div>
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingPage;

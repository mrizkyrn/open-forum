interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium', text }) => {
  const sizeClass = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center py-4 gap-2">
      <div className={`${sizeClass[size]} animate-spin rounded-full border-4 border-gray-200 border-t-green-600`}></div>
      {text && <p className="ml-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;

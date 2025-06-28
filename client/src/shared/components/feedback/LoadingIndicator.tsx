import { Loader2 } from 'lucide-react';

export type IndicatorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IndicatorVariant = 'primary' | 'secondary' | 'accent' | 'white' | 'dark';
export type IndicatorType = 'circle' | 'dots';

export interface LoadingIndicatorProps {
  size?: IndicatorSize;
  text?: string;
  variant?: IndicatorVariant;
  type?: IndicatorType;
  fullscreen?: boolean;
  fullWidth?: boolean;
  vertical?: boolean;
  className?: string;
  textClassName?: string;
  color?: string;
}

// Helper function to join classNames with proper spacing
const classNames = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

const LoadingIndicator = ({
  size = 'md',
  text,
  variant = 'primary',
  type = 'circle',
  fullscreen = false,
  fullWidth = false,
  vertical = false,
  className = '',
  textClassName = '',
  color,
}: LoadingIndicatorProps) => {
  const sizeClass =
    size === 'xs'
      ? 'h-4 w-4'
      : size === 'sm'
        ? 'h-6 w-6'
        : size === 'md'
          ? 'h-8 w-8'
          : size === 'lg'
            ? 'h-12 w-12'
            : 'h-16 w-16';

  const textColors = {
    primary: 'text-gray-700',
    secondary: 'text-gray-700',
    accent: 'text-gray-700',
    white: 'text-white',
    dark: 'text-gray-800',
  };

  const fullscreenClass = fullscreen ? 'fixed inset-0 flex items-center justify-center bg-black/40 z-50' : '';

  const containerClass = classNames(
    'flex items-center',
    vertical ? 'flex-col gap-3' : 'gap-3',
    fullWidth ? 'w-full justify-center' : '',
    fullscreen ? '' : 'py-4',
    className,
  );

  const getColorClass = () => {
    if (color) return '';

    switch (variant) {
      case 'white':
        return 'text-white';
      case 'secondary':
        return 'text-blue-600';
      case 'accent':
        return 'text-purple-600';
      case 'dark':
        return 'text-gray-800';
      default:
        return 'text-green-600';
    }
  };

  const renderIndicator = () => {
    switch (type) {
      case 'circle':
        return (
          <Loader2
            className={`${sizeClass} animate-spin ${getColorClass()}`}
            style={color ? { color } : {}}
            aria-hidden="true"
          />
        );

      case 'dots':
        return (
          <div className="flex gap-1" aria-label="Loading">
            {[0, 1, 2].map((i) => {
              const dotSizeClass =
                size === 'xs'
                  ? 'h-1.5 w-1.5'
                  : size === 'sm'
                    ? 'h-2 w-2'
                    : size === 'md'
                      ? 'h-2.5 w-2.5'
                      : size === 'lg'
                        ? 'h-3 w-3'
                        : 'h-4 w-4';

              return (
                <div
                  key={i}
                  className={`rounded-full ${dotSizeClass} ${color ? '' : getColorClass().replace('text-', 'bg-')}`}
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.9s',
                    animationIterationCount: 'infinite',
                    animationName: 'LoadingDotAnimation',
                    animationTimingFunction: 'ease-in-out',
                    backgroundColor: color || undefined,
                  }}
                />
              );
            })}
          </div>
        );

      default:
        return <Loader2 className={`${sizeClass} animate-spin ${getColorClass()}`} />;
    }
  };

  return (
    <div className={classNames(fullscreenClass, containerClass)}>
      {renderIndicator()}

      {text && (
        <p
          className={classNames('text-sm', color ? '' : textColors[variant], !vertical && 'pl-1', textClassName)}
          style={color ? { color } : {}}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingIndicator;

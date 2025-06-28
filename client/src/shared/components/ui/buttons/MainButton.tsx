import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/20',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300/50',
  outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300/50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300/50',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500/20',
  success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500/20',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'text-xs px-4 h-8',
  md: 'text-sm px-5 h-9',
  lg: 'text-base px-6 h-10',
  xl: 'text-lg px-7 h-12',
};

const LOADER_SIZES: Record<ButtonSize, number> = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

const MainButton = forwardRef<HTMLButtonElement, MainButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    const buildClassName = () => {
      const classes = [
        'font-semibold rounded-lg flex items-center justify-center transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',

        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
      ];

      if (isDisabled) {
        classes.push('opacity-70 cursor-not-allowed');
      } else {
        classes.push('cursor-pointer');
      }

      if (fullWidth) {
        classes.push('w-full');
      }

      if (className) {
        classes.push(className);
      }

      return classes.filter(Boolean).join(' ');
    };

    const renderIcon = (icon: React.ReactNode, position: 'left' | 'right') => {
      if (!icon || isLoading) return null;

      const marginClass = position === 'left' ? 'mr-2' : 'ml-2';
      return <span className={marginClass}>{icon}</span>;
    };

    return (
      <button ref={ref} type={type} disabled={isDisabled} className={buildClassName()} {...props}>
        {isLoading && <Loader2 size={LOADER_SIZES[size]} className="mr-2 animate-spin" />}

        {renderIcon(leftIcon, 'left')}

        <span className={isLoading ? 'opacity-75' : ''}>{children}</span>

        {renderIcon(rightIcon, 'right')}
      </button>
    );
  },
);

MainButton.displayName = 'MainButton';

export default MainButton;

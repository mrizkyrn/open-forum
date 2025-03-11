import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface MainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const MainButton = React.forwardRef<HTMLButtonElement, MainButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    // Base styles always applied
    const baseStyles = 'font-semibold rounded-lg flex items-center justify-center transition-colors focus:outline-none';

    // Variant styles
    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-1 focus:ring-primary-darker',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-1 focus:ring-gray-300',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-1 focus:ring-gray-300',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-1 focus:ring-gray-200',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-1 focus:ring-red-800',
    };

    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-4 py-3',
      lg: 'text-base px-6 py-4',
    };

    // State styles
    const stateStyles = {
      disabled: 'opacity-70 cursor-not-allowed',
      fullWidth: 'w-full',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles} 
          ${variantStyles[variant]} 
          ${sizeStyles[size]}
          ${isLoading || disabled ? stateStyles.disabled : 'cursor-pointer'}
          ${fullWidth ? stateStyles.fullWidth : ''}
          ${className || ''}
        `}
        {...props}
      >
        {isLoading && <Loader2 size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} className="mr-2 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);

MainButton.displayName = 'Button';

export default MainButton;

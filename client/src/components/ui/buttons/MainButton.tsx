import { Loader2 } from 'lucide-react';
import React from 'react';

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
    const baseStyles = 'font-semibold rounded-lg flex items-center justify-center transition-colors';

    // Variant styles
    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
      success: 'bg-green-500 text-white hover:bg-green-600',
    };

    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-4 h-8',
      md: 'text-sm px-5 h-9',
      lg: 'text-base px-6 h-10',
      xl: 'text-lg px-7 h-12',
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
        className={` ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading || disabled ? stateStyles.disabled : 'cursor-pointer'} ${fullWidth ? stateStyles.fullWidth : ''} ${className || ''} `}
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

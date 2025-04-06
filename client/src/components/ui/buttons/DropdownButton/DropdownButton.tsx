import { ChevronDown } from 'lucide-react';
import React from 'react';

export type DropdownButtonVariant = 'default' | 'primary' | 'outline' | 'ghost' | 'filter';
export type DropdownButtonSize = 'sm' | 'md' | 'lg';
export type DropdownButtonAlignment = 'left' | 'right' | 'center';

interface DropdownButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isOpen: boolean;
  variant?: DropdownButtonVariant;
  size?: DropdownButtonSize;
  hideCaretIcon?: boolean;
  showActiveState?: boolean;
  fullWidth?: boolean;
}

export const DropdownButton = React.forwardRef<HTMLButtonElement, DropdownButtonProps>(
  (
    {
      children,
      isOpen,
      variant = 'default',
      size = 'sm',
      hideCaretIcon = false,
      showActiveState = false,
      fullWidth = false,
      className = '',
      ...props
    },
    ref,
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none';

    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-2.5 h-8',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-5 py-2.5',
    };

    // Variant styles (including the filter style from DiscussionSearchBar)
    const variantStyles = {
      default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
      primary: 'bg-green-600 text-white hover:bg-green-700 border border-transparent',
      outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent',
      filter:
        showActiveState || isOpen
          ? 'bg-green-50 border border-green-200 text-green-700 font-normal'
          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-normal',
    };

    // State styles
    const stateStyles = {
      fullWidth: 'w-full',
      disabled: 'opacity-70 cursor-not-allowed',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? stateStyles.fullWidth : ''} ${props.disabled ? stateStyles.disabled : ''} ${className} `}
        {...props}
      >
        {children}

        {!hideCaretIcon && (
          <ChevronDown
            size={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
            className={`ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        )}
      </button>
    );
  },
);

DropdownButton.displayName = 'DropdownButton';

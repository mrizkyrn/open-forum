import { Search, X } from 'lucide-react';
import React, { ChangeEvent, InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  /** Current search term */
  value: string;

  /** Callback when search term changes */
  onChange: (value: string) => void;

  /** Optional placeholder text */
  placeholder?: string;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Whether to show the clear button */
  showClearButton?: boolean;

  /** Optional additional class names */
  className?: string;

  /** Icon to use (defaults to Search) */
  icon?: React.ReactNode;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  size = 'md',
  showClearButton = true,
  className = '',
  icon,
  ...props
}) => {
  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle clear button click
  const handleClear = () => {
    onChange('');
  };

  // Size-based styles
  const sizeClasses = {
    sm: 'h-8 text-xs pl-8 pr-7',
    md: 'h-9 text-xs pl-9 pr-8',
    lg: 'h-10 text-sm pl-10 pr-9',
  };

  // Icon sizes
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`focus:border-primary w-full rounded-md border border-gray-300 focus:outline-none ${sizeClasses[size]} ${className}`}
        {...props}
      />

      <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">{icon || <Search size={iconSize} />}</div>

      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={iconSize} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

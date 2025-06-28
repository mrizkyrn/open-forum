import { Search, X } from 'lucide-react';
import { ChangeEvent, InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  showClearButton?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const SIZE_CLASSES = {
  sm: 'h-8 text-xs pl-8 pr-7',
  md: 'h-9 text-xs pl-9 pr-8',
  lg: 'h-10 text-sm pl-10 pr-9',
} as const;

const ICON_SIZES = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  size = 'md',
  showClearButton = true,
  className = '',
  icon,
  ...props
}: SearchInputProps) => {
  const iconSize = ICON_SIZES[size];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  const buildInputClassName = () => {
    const baseClasses = [
      'w-full rounded-md border border-gray-300 focus:border-primary focus:outline-none',
      SIZE_CLASSES[size],
    ];

    return [...baseClasses, className].filter(Boolean).join(' ');
  };

  const renderSearchIcon = () => {
    return (
      <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">{icon || <Search size={iconSize} />}</div>
    );
  };

  const renderClearButton = () => {
    if (!showClearButton || !value) return null;

    return (
      <button
        type="button"
        onClick={handleClear}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
        aria-label="Clear search"
      >
        <X size={iconSize} />
      </button>
    );
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={buildInputClassName()}
        {...props}
      />

      {renderSearchIcon()}
      {renderClearButton()}
    </div>
  );
};

export default SearchInput;

import { Filter } from 'lucide-react';
import React from 'react';

interface SelectFilterOption {
  value: string | number | boolean;
  label: string;
}

interface SelectFilterProps {
  options: SelectFilterOption[];
  value: string | number | boolean | undefined;
  onChange: (value: any) => void;
  placeholder?: string;
  name?: string;
  className?: string;
  leftIcon?: React.ReactNode;
}

const SelectFilter: React.FC<SelectFilterProps> = ({
  options,
  value,
  onChange,
  placeholder,
  name,
  className = '',
  leftIcon = <Filter size={14} className="mr-1.5" />,
}) => {
  // Handle change and convert to appropriate type
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    // If empty string, return undefined
    if (selectedValue === '') {
      onChange(undefined);
      return;
    }

    // Try to convert to appropriate type
    if (selectedValue === 'true') {
      onChange(true);
    } else if (selectedValue === 'false') {
      onChange(false);
    } else if (!isNaN(Number(selectedValue))) {
      onChange(Number(selectedValue));
    } else {
      onChange(selectedValue);
    }
  };

  // Convert current value to string for the select
  const stringValue = value === undefined ? '' : String(value);

  return (
    <div className="relative inline-flex w-full items-center md:w-fit">
      {leftIcon && <div className="pointer-events-none absolute left-3 text-gray-400">{leftIcon}</div>}
      <select
        name={name}
        value={stringValue}
        onChange={handleChange}
        className={`text-dark w-full rounded-lg border border-gray-300 bg-gray-50 py-2 text-sm focus:border-green-500 focus:ring-green-500 focus:outline-none ${leftIcon ? 'pr-3 pl-8' : 'px-3'} ${className}`}
        aria-label={name || 'Filter'}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectFilter;

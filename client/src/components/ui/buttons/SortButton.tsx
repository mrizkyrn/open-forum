import { SortOrder } from '@/types/SearchTypes';
import { ArrowDown, ArrowUp } from 'lucide-react';
import React from 'react';

export interface SortButtonProps<T extends string | number> {
  /** Label to display on the button */
  label: string;

  /** Icon to display before the label */
  icon: React.ReactNode;

  /** Current active sort option */
  currentSortBy: T;

  /** The sort option this button represents */
  sortBy: T;

  /** Current sort direction (only relevant if this button is active) */
  sortOrder: SortOrder;

  /** Callback when sort is changed */
  onSortChange: (sortBy: T) => void;

  /** Optional custom classes */
  className?: string;

  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
}

export function SortButton<T extends string | number>({
  label,
  icon,
  currentSortBy,
  sortBy,
  sortOrder,
  onSortChange,
  className = '',
  size = 'xs',
}: SortButtonProps<T>) {
  const isActive = currentSortBy === sortBy;

  const sizeClasses = {
    xs: 'text-xs h-7',
    sm: 'text-sm h-8',
    md: 'text-sm h-9',
  };

  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : 16;

  return (
    <button
      onClick={() => onSortChange(sortBy)}
      className={`inline-flex items-center gap-1.5 rounded border px-2 transition-all ${sizeClasses[size]} ${
        isActive
          ? 'text-primary border-green-200 bg-green-50'
          : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
      } ${className}`}
      aria-pressed={isActive}
      title={`Sort by ${label} ${isActive ? (sortOrder === SortOrder.ASC ? 'ascending' : 'descending') : ''}`}
    >
      <span className={`${isActive ? 'text-primary' : 'text-gray-500'}`}>{icon}</span>

      <span >{label}</span>

      {isActive && (
        <span className="text-primary flex h-3.5 w-3.5 items-center justify-center">
          {sortOrder === SortOrder.ASC ? (
            <ArrowUp size={iconSize} className="transition-transform duration-150" />
          ) : (
            <ArrowDown size={iconSize} className="transition-transform duration-150" />
          )}
        </span>
      )}
    </button>
  );
}

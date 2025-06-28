import { SortOrder } from '@/shared/types/SearchTypes';
import { ArrowDown, ArrowUp } from 'lucide-react';

export interface SortButtonProps<T extends string | number> {
  label: string;
  icon: React.ReactNode;
  currentSortBy: T;
  sortBy: T;
  sortOrder: SortOrder;
  onSortChange: (sortBy: T) => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

const SIZE_CLASSES = {
  xs: 'text-xs h-7',
  sm: 'text-sm h-8',
  md: 'text-sm h-9',
} as const;

const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
} as const;

const SortButton = <T extends string | number>({
  label,
  icon,
  currentSortBy,
  sortBy,
  sortOrder,
  onSortChange,
  className = '',
  size = 'xs',
}: SortButtonProps<T>) => {
  const isActive = currentSortBy === sortBy;
  const iconSize = ICON_SIZES[size];

  const buildClassName = () => {
    const baseClasses = ['inline-flex items-center gap-1.5 rounded border px-2 transition-all', SIZE_CLASSES[size]];

    const stateClasses = isActive
      ? 'text-primary border-green-200 bg-green-50'
      : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100';

    return [...baseClasses, stateClasses, className].filter(Boolean).join(' ');
  };

  const getAriaLabel = () => {
    const sortDirection = isActive ? (sortOrder === SortOrder.ASC ? 'ascending' : 'descending') : '';
    return `Sort by ${label} ${sortDirection}`.trim();
  };

  const renderSortIcon = () => {
    if (!isActive) return null;

    const IconComponent = sortOrder === SortOrder.ASC ? ArrowUp : ArrowDown;

    return (
      <span className="text-primary flex h-3.5 w-3.5 items-center justify-center">
        <IconComponent size={iconSize} className="transition-transform duration-150" />
      </span>
    );
  };

  return (
    <button
      onClick={() => onSortChange(sortBy)}
      className={buildClassName()}
      aria-pressed={isActive}
      title={getAriaLabel()}
    >
      <span className={isActive ? 'text-primary' : 'text-gray-500'}>{icon}</span>

      <span>{label}</span>

      {renderSortIcon()}
    </button>
  );
};

export default SortButton;

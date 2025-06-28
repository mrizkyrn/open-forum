import MainButton from '@/shared/components/ui/buttons/MainButton';
import SearchInput from '@/shared/components/ui/inputs/SearchInput';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface FilterBarProps {
  searchProps?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    showClearButton?: boolean;
  };
  children?: ReactNode;
  className?: string;
  title?: string;
  collapsible?: boolean;
  onReset?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchProps,
  children,
  className = '',
  title = 'Filters',
  collapsible = true,
  onReset,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const hasFilters = !!children;

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}>
      {/* Search area - always visible */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        {searchProps && (
          <div className="flex-grow">
            <SearchInput
              value={searchProps.value}
              onChange={searchProps.onChange}
              placeholder={searchProps.placeholder || 'Search...'}
              size={searchProps.size || 'lg'}
              showClearButton={searchProps.showClearButton !== false}
            />
          </div>
        )}

        {/* Collapsible trigger for mobile */}
        {hasFilters && collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:hidden"
          >
            {title}
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
      </div>

      {/* Filters section - collapsible on mobile */}
      {hasFilters && (
        <div
          className={`border-t border-gray-100 bg-gray-50 px-4 py-3 ${collapsible && isCollapsed ? 'hidden sm:block' : 'block'} `}
        >
          {/* Optional filter section title - visible on desktop */}
          {title && <div className="mb-2 hidden text-xs font-semibold text-gray-500 uppercase sm:block">{title}</div>}

          {/* Filter items with better wrapping and spacing */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {children}
            <MainButton onClick={onReset} variant="outline" leftIcon={<RefreshCw size={16} />}>
              Reset Filters
            </MainButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;

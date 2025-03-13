import { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface FilterBarProps {
  searchProps?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  children?: ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({ searchProps, children }) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row">
      {searchProps && (
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder={searchProps.placeholder || 'Search...'}
              value={searchProps.value}
              onChange={(e) => searchProps.onChange(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
};

export default FilterBar;

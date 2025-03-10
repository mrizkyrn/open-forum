import { X } from 'lucide-react';
import { SearchDiscussionDto } from '../types/DiscussionRequestTypes';

interface ActiveFiltersProps {
  currentFilters: SearchDiscussionDto;
  onFilterChange: (filter: Partial<SearchDiscussionDto>) => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ currentFilters, onFilterChange, onClearAll }) => {
  // Check if there are any active filters
  const hasActiveFilters =
    !!currentFilters.search ||
    (Array.isArray(currentFilters.tags) && currentFilters.tags.length > 0) ||
    currentFilters.isAnonymous !== undefined;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {/* Search term */}
      {currentFilters.search && (
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
          <span>"{currentFilters.search}"</span>
          <button
            onClick={() => onFilterChange({ search: undefined })}
            className="ml-1 rounded-full p-0.5 hover:bg-green-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tag filters */}
      {currentFilters.tags &&
        currentFilters.tags.map((tag) => (
          <div key={tag} className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
            <span>#{tag}</span>
            <button
              onClick={() =>
                onFilterChange({
                  tags: currentFilters.tags?.filter((t) => t !== tag),
                })
              }
              className="ml-1 rounded-full p-0.5 hover:bg-green-200"
            >
              <X size={14} />
            </button>
          </div>
        ))}

      {/* Anonymity filter */}
      {currentFilters.isAnonymous !== undefined && (
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
          <span>{currentFilters.isAnonymous ? 'Anonymous only' : 'Named authors only'}</span>
          <button
            onClick={() => onFilterChange({ isAnonymous: undefined })}
            className="ml-1 rounded-full p-0.5 hover:bg-green-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Clear all button */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Clear all
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default ActiveFilters;

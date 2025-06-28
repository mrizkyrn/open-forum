import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import SortButton from '@/shared/components/ui/buttons/SortButton';
import { SortOrder } from '@/shared/types/SearchTypes';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  MessageCircle,
  Plus,
  RefreshCw,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface DiscussionSearchBarProps {
  currentFilters: SearchDiscussionDto;
  onFilterChange: (filter: Partial<SearchDiscussionDto>) => void;
  onReset?: () => void;
}

const DiscussionSearchBar: React.FC<DiscussionSearchBarProps> = ({
  currentFilters,
  onFilterChange,
  onReset = () => {},
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState<string>('');

  const sortBy = currentFilters.sortBy ?? DiscussionSortBy.createdAt;
  const sortOrder = currentFilters.sortOrder ?? SortOrder.DESC;
  const selectedTags = currentFilters.tags || [];

  const handleSortChange = (newSortBy: DiscussionSortBy) => {
    if (sortBy === newSortBy) {
      onFilterChange({
        sortOrder: sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
      });
    } else {
      onFilterChange({ sortBy: newSortBy, sortOrder: SortOrder.DESC });
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || selectedTags.includes(tag)) {
      setTagInput('');
      return;
    }
    onFilterChange({ tags: [...selectedTags, tag] });
    setTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    onFilterChange({ tags: selectedTags.filter((t) => t !== tag) });
  };

  const handleAnonymityChange = (value: boolean | undefined) => {
    onFilterChange({ isAnonymous: value });
  };

  return (
    <div className="rounded-md border border-gray-100 bg-white p-3">
      <button
        onClick={() => setShowFilters((prev) => !prev)}
        className="flex items-center rounded-md text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        <Filter size={14} className="mr-2" />
        <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        {showFilters ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
      </button>

      {showFilters && (
        <div className="mt-3">
          {/* Main toolbar - Sort options */}
          <div className="flex flex-col border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
              {/* Tag Input */}
              <div className="relative w-full sm:w-auto">
                <div className="flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder={selectedTags.length ? 'Add another tag...' : 'Add tag...'}
                    className="h-6 w-full border-none bg-transparent text-xs outline-none focus:ring-0 sm:w-32"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                    className="flex h-6 items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Anonymity Toggle */}
              <button
                onClick={() => handleAnonymityChange(!currentFilters.isAnonymous)}
                className={`inline-flex h-8 items-center gap-1.5 rounded border px-2 text-xs transition-all ${
                  currentFilters.isAnonymous
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User size={14} />
                <span>Anonymous</span>
              </button>
            </div>

            {/* Clear All Button */}
            <MainButton
              onClick={onReset}
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              className="mt-2 !font-normal sm:mt-0"
            >
              Clear all
            </MainButton>
          </div>

          {/* Modern Tag Input System */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-xs text-gray-400">Sort:</span>

            <div className="flex flex-wrap gap-1.5">
              <SortButton<DiscussionSortBy>
                label="Date"
                icon={<Calendar size={14} />}
                currentSortBy={sortBy}
                sortBy={DiscussionSortBy.createdAt}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />

              <SortButton<DiscussionSortBy>
                label="Comments"
                icon={<MessageCircle size={14} />}
                currentSortBy={sortBy}
                sortBy={DiscussionSortBy.commentCount}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />

              <SortButton<DiscussionSortBy>
                label="Votes"
                icon={<ThumbsUp size={14} />}
                currentSortBy={sortBy}
                sortBy={DiscussionSortBy.voteCount}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {selectedTags.map((tag) => (
            <div
              key={tag}
              className="flex h-7 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 text-xs text-green-700"
            >
              <span>#{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 hover:bg-green-200"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionSearchBar;

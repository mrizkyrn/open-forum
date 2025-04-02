import { Dropdown, DropdownButton, DropdownItem } from '@/components/ui/buttons/DropdownButton';
import { SortButton } from '@/components/ui/buttons/SortButton';
import { SearchInput } from '@/components/ui/inputs/SearchInput';
import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import { SortOrder } from '@/types/SearchTypes';
import { Calendar, MessageCircle, Plus, RefreshCw, SlidersHorizontal, ThumbsUp, User, X } from 'lucide-react';
import { useState } from 'react';

interface DiscussionSearchBarProps {
  currentFilters: SearchDiscussionDto;
  onFilterChange: (filter: Partial<SearchDiscussionDto>) => void;
  onSearch: (searchTerm: string) => void;
  onReset?: () => void;
}

const DiscussionSearchBar: React.FC<DiscussionSearchBarProps> = ({
  currentFilters,
  onFilterChange,
  onSearch,
  onReset = () => {},
}) => {
  const [tagInput, setTagInput] = useState<string>('');

  const commonTags = ['question', 'help', 'announcement', 'discussion', 'general'];

  const sortBy = currentFilters.sortBy ?? DiscussionSortBy.createdAt;
  const sortOrder = currentFilters.sortOrder ?? SortOrder.DESC;
  const selectedTags = currentFilters.tags || [];
  const searchTerm = currentFilters.search || '';

  const hasActiveFilters = !!searchTerm || selectedTags.length > 0;

  const handleSearchChange = (value: string) => {
    onSearch(value);
  };

  const handleSortChange = (newSortBy: DiscussionSortBy) => {
    if (sortBy === newSortBy) {
      onFilterChange({
        sortOrder: sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
      });
    } else {
      onFilterChange({ sortBy: newSortBy, sortOrder: SortOrder.DESC });
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onFilterChange({ tags: selectedTags.filter((t) => t !== tag) });
    } else {
      onFilterChange({ tags: [...selectedTags, tag] });
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

  const tagSuggestions = commonTags
    .filter((tag) => tag.includes(tagInput.toLowerCase()) && !selectedTags.includes(tag))
    .slice(0, 5);

  return (
    <div className="rounded-md bg-white">
      {/* Search input */}
      <div className="mb-3">
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search discussions..."
          size="lg"
          className="focus:ring-2 focus:ring-green-200"
        />
      </div>

      {/* Main toolbar - Sort options */}
      <div className="flex flex-col border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <div className="flex items-center">
            <SlidersHorizontal size={16} className="mr-1.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="ml-4 flex items-center text-xs text-gray-500 transition-colors hover:text-gray-700"
            >
              <RefreshCw size={12} className="mr-1" />
              Clear all
            </button>
          )}
        </div>

        {/* Sort options */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-xs text-gray-400">Sort:</span>

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

      {/* Modern Tag Input System */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tag Input */}
          <div className="relative">
            <div className="flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder={selectedTags.length ? 'Add another tag...' : 'Add tag...'}
                className="h-6 w-28 border-none bg-transparent text-xs outline-none focus:ring-0 sm:w-32"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="flex h-6 items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Tag Suggestions */}
            {tagInput && tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-md border border-gray-100 bg-white py-1 shadow-sm">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      handleTagToggle(tag);
                      setTagInput('');
                    }}
                    className="flex w-full items-center px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Dropdown
            trigger={({ isOpen, toggle }) => (
              <DropdownButton
                onClick={toggle}
                isOpen={isOpen}
                variant="filter"
                showActiveState={currentFilters.isAnonymous !== undefined}
              >
                <User
                  size={14}
                  className={currentFilters.isAnonymous !== undefined ? 'text-green-600' : 'text-gray-400'}
                />
                <span className="ml-1">Author</span>
              </DropdownButton>
            )}
            align="left"
          >
            <DropdownItem
              onClick={() => handleAnonymityChange(undefined)}
              active={currentFilters.isAnonymous === undefined}
            >
              All discussions
            </DropdownItem>
            <DropdownItem onClick={() => handleAnonymityChange(false)} active={currentFilters.isAnonymous === false}>
              Named authors only
            </DropdownItem>
            <DropdownItem onClick={() => handleAnonymityChange(true)} active={currentFilters.isAnonymous === true}>
              Anonymous only
            </DropdownItem>
          </Dropdown>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
    </div>
  );
};

export default DiscussionSearchBar;

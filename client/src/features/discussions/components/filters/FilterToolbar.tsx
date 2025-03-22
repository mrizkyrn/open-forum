import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import { useDropdown } from '@/hooks/useDropdown';
import { SortOrder } from '@/types/SearchTypes';
import { Calendar, ChevronDown, MessageCircle, Plus, SlidersHorizontal, Tags, ThumbsUp, User, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface FilterToolbarProps {
  currentFilters: SearchDiscussionDto;
  onFilterChange: (filter: Partial<SearchDiscussionDto>) => void;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({ currentFilters, onFilterChange }) => {
  const [customTagInput, setCustomTagInput] = useState<string>('');

  // Dropdown refs and hooks
  const tagsDropdownRef = useRef<HTMLDivElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const tagsDropdown = useDropdown(tagsDropdownRef as React.RefObject<HTMLElement>);
  const authorDropdown = useDropdown(authorDropdownRef as React.RefObject<HTMLElement>);

  // Common predefined tags
  const commonTags = ['question', 'help', 'announcement', 'discussion', 'general'];

  const handleSortChange = (sortBy: DiscussionSortBy) => {
    if (currentFilters.sortBy === sortBy) {
      onFilterChange({
        sortOrder: currentFilters.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC,
      });
    } else {
      onFilterChange({ sortBy, sortOrder: SortOrder.DESC });
    }
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = currentFilters.tags || [];

    if (currentTags.includes(tag)) {
      onFilterChange({
        tags: currentTags.filter((t) => t !== tag),
      });
    } else {
      onFilterChange({
        tags: [...currentTags, tag],
      });
    }
  };

  const handleAddCustomTag = () => {
    const tagToAdd = customTagInput.trim().toLowerCase();

    // Validate the tag
    if (!tagToAdd) return;

    const currentTags = currentFilters.tags || [];

    // Don't add duplicates
    if (currentTags.includes(tagToAdd)) {
      setCustomTagInput('');
      return;
    }

    // Add the custom tag
    onFilterChange({
      tags: [...currentTags, tagToAdd],
    });

    // Clear the input
    setCustomTagInput('');
  };

  const handleCustomTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleAnonymityChange = (value: boolean | undefined) => {
    onFilterChange({ isAnonymous: value });
    authorDropdown.close();
  };

  // Get the total count of common tags that are currently active
  const activeCommonTagsCount = currentFilters.tags
    ? currentFilters.tags.filter((tag) => commonTags.includes(tag)).length
    : 0;

  // Get the total count of custom tags that are currently active
  const activeCustomTagsCount = currentFilters.tags
    ? currentFilters.tags.filter((tag) => !commonTags.includes(tag)).length
    : 0;

  // Total active tags
  const totalActiveTags = activeCommonTagsCount + activeCustomTagsCount;

  return (
    <div>
      {/* Main toolbar - Sort options */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100">
        <div className="flex items-center">
          <SlidersHorizontal size={18} className="mr-2 text-gray-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        {/* Sort options */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>

          {/* Sort date button */}
          <button
            onClick={() => handleSortChange(DiscussionSortBy.createdAt)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
              currentFilters.sortBy === DiscussionSortBy.createdAt
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={14} />
            Date
            {currentFilters.sortBy === DiscussionSortBy.createdAt && (
              <span>{currentFilters.sortOrder === SortOrder.ASC ? '↑' : '↓'}</span>
            )}
          </button>

          {/* Sort comments button */}
          <button
            onClick={() => handleSortChange(DiscussionSortBy.commentCount)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
              currentFilters.sortBy === DiscussionSortBy.commentCount
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle size={14} />
            Comments
            {currentFilters.sortBy === DiscussionSortBy.commentCount && (
              <span>{currentFilters.sortOrder === SortOrder.ASC ? '↑' : '↓'}</span>
            )}
          </button>

          {/* Sort votes button */}
          <button
            onClick={() => handleSortChange(DiscussionSortBy.upvoteCount)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
              currentFilters.sortBy === DiscussionSortBy.upvoteCount
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ThumbsUp size={14} />
            Votes
            {currentFilters.sortBy === DiscussionSortBy.upvoteCount && (
              <span>{currentFilters.sortOrder === SortOrder.ASC ? '↑' : '↓'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filter options */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tags Dropdown */}
        <div ref={tagsDropdownRef} className="relative">
          <button
            onClick={tagsDropdown.toggle}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
              tagsDropdown.isOpen || totalActiveTags > 0
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tags size={14} />
            Tags {totalActiveTags > 0 && `(${totalActiveTags})`}
            <ChevronDown size={14} />
          </button>

          {tagsDropdown.isOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 w-72 rounded-md bg-white p-3 shadow-sm">
              {/* Custom Tag Section */}
              <div className="mb-3">
                <h3 className="mb-1 text-xs font-medium text-gray-500">Add Custom Tag</h3>
                <div className="flex gap-1">
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={handleCustomTagInputKeyDown}
                      placeholder="Enter tag..."
                      className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    {customTagInput && (
                      <button
                        onClick={() => setCustomTagInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleAddCustomTag}
                    disabled={!customTagInput.trim()}
                    className="flex-shrink-0 rounded-md bg-green-100 px-3 py-1 text-xs text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <Plus size={14} className="inline mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Common Tags Section */}
              <div className="mb-3">
                <h3 className="mb-1 text-xs font-medium text-gray-500">Common Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => {
                    const isSelected = Array.isArray(currentFilters.tags) && currentFilters.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`rounded-full px-3 py-1 text-xs ${
                          isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Author Type Dropdown */}
        <div ref={authorDropdownRef} className="relative">
          <button
            onClick={authorDropdown.toggle}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
              authorDropdown.isOpen || currentFilters.isAnonymous !== undefined
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User size={14} />
            Author
            <ChevronDown size={14} />
          </button>

          {authorDropdown.isOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 w-56 rounded-md bg-white p-2 shadow-sm">
              <button
                onClick={() => handleAnonymityChange(undefined)}
                className={`flex w-full items-center rounded px-3 py-2 text-left text-sm ${
                  currentFilters.isAnonymous === undefined
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All discussions
              </button>
              <button
                onClick={() => handleAnonymityChange(false)}
                className={`flex w-full items-center rounded px-3 py-2 text-left text-sm ${
                  currentFilters.isAnonymous === false
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Named authors only
              </button>
              <button
                onClick={() => handleAnonymityChange(true)}
                className={`flex w-full items-center rounded px-3 py-2 text-left text-sm ${
                  currentFilters.isAnonymous === true
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Anonymous only
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;

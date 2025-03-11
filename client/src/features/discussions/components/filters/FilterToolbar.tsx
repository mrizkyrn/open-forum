import { useState } from 'react';
import { SlidersHorizontal, Calendar, MessageCircle, ThumbsUp, ChevronDown, Tags, User } from 'lucide-react';
import { DiscussionSortBy, SortOrder, SearchDiscussionDto } from '@/features/discussions/types';

interface FilterToolbarProps {
  currentFilters: SearchDiscussionDto;
  onFilterChange: (filter: Partial<SearchDiscussionDto>) => void;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({ currentFilters, onFilterChange }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const commonTags = ['question', 'help', 'announcement', 'discussion', 'general'];

  const toggleDropdown = (dropdown: string) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

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

  const handleAnonymityChange = (value: boolean | undefined) => {
    onFilterChange({ isAnonymous: value });
  };

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
        <div className="relative">
          <button
            onClick={() => toggleDropdown('tags')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
              activeDropdown === 'tags' || (Array.isArray(currentFilters.tags) && currentFilters.tags.length > 0)
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tags size={14} />
            Tags
            <ChevronDown size={14} />
          </button>

          {activeDropdown === 'tags' && (
            <div className="absolute top-full left-0 z-10 mt-1 w-56 rounded-md bg-white p-3 shadow-lg">
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
          )}
        </div>

        {/* Author Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('author')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
              activeDropdown === 'author' || currentFilters.isAnonymous !== undefined
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User size={14} />
            Author
            <ChevronDown size={14} />
          </button>

          {activeDropdown === 'author' && (
            <div className="absolute top-full left-0 z-10 mt-1 w-56 rounded-md bg-white p-2 shadow-lg">
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

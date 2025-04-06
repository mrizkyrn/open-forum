import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Eye, MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import UserAvatar from '@/components/layouts/UserAvatar';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { DataTable } from '@/features/admin/components/DataTable';
import FilterBar from '@/features/admin/components/FilterBar';
import PageHeader from '@/features/admin/components/PageHeader';
import Pagination from '@/features/admin/components/Pagination';
import SelectFilter from '@/features/admin/components/SelectFilter';
import { useDiscussions } from '@/features/discussions/hooks/useDiscussions';
import { discussionApi } from '@/features/discussions/services';
import { Discussion } from '@/features/discussions/types';
import { useSpaces } from '@/features/spaces/hooks/useSpaces';
import { useDropdown } from '@/hooks/useDropdown';
import { truncateText } from '@/utils/helpers';

const DiscussionManagementPage = () => {
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isOpen: isDropdownOpen,
    toggle: toggleDropdown,
    close: closeDropdown,
  } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  const { spaces } = useSpaces();

  const {
    discussions,
    meta,
    isLoading,
    isError,
    filters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSortChange,
    handleSpaceFilterChange,
    handleTagFilterChange,
    handleAnonymousFilterChange,
    handleResetFilters,
  } = useDiscussions();

  const handleToggleDropdown = (discussionId: number) => {
    if (activeDropdownId === discussionId) {
      toggleDropdown();
    } else {
      setActiveDropdownId(discussionId);
      setTimeout(() => toggleDropdown(), 0);
    }
  };

  const handleDeletePrompt = (discussion: Discussion) => {
    setSelectedDiscussion(discussion);
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const handleDeleteDiscussion = async () => {
    if (selectedDiscussion) {
      try {
        setIsDeleting(true);
        await discussionApi.deleteDiscussion(selectedDiscussion.id);
        queryClient.invalidateQueries({ queryKey: ['discussions'] });
        setIsDeleteModalOpen(false);
        toast.success('Discussion deleted successfully');
      } catch (error) {
        console.error('Error deleting discussion:', error);
        toast.error('Failed to delete discussion');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedDiscussion(null);
  };

  const handleExportDiscussions = () => {
    console.log('Export discussions');
    // Implementation for exporting discussions
  };

  const getAllUniqueTags = () => {
    const allTags = new Set<string>();
    discussions.forEach((discussion) => {
      discussion.tags?.forEach((tag) => {
        allTags.add(tag);
      });
    });
    return Array.from(allTags).sort();
  };

  const columns = [
    {
      header: 'Discussion',
      accessor: (discussion: Discussion) => (
        <div className="max-w-lg">
          <div className="text-dark font-medium">{truncateText(discussion.content, 80)}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center">
              <MessageSquare size={12} className="mr-1" />
              {discussion.commentCount} comments
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Author',
      accessor: (discussion: Discussion) => (
        <div className="flex items-center">
          {discussion.author ? (
            <>
              <UserAvatar fullName={discussion.author.fullName} avatarUrl={discussion.author.avatarUrl} size="sm" />
              <div className="ml-3">
                <div className="text-dark text-sm font-medium">{discussion.author.fullName}</div>
                <div className="text-xs text-gray-500">@{discussion.author.username}</div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Unknown</div>
          )}
        </div>
      ),
    },
    {
      header: 'Anonymous',
      accessor: (discussion: Discussion) => (
        <div className="flex items-center">
          <span
            className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${
              discussion.isAnonymous ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-700'
            }`}
          >
            {discussion.isAnonymous ? 'Yes' : 'No'}
          </span>
        </div>
      ),
    },
    {
      header: 'Space',
      accessor: (discussion: Discussion) => (
        <div className="flex items-center">
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-sm font-medium text-green-700">
            {discussion.space.name}
          </span>
        </div>
      ),
    },
    {
      header: 'Tags',
      accessor: (discussion: Discussion) => (
        <div className="flex flex-wrap gap-1">
          {discussion.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {tag}
            </span>
          )) || <span className="text-sm text-gray-400">No tags</span>}
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: (discussion: Discussion) => (
        <span className="text-sm whitespace-nowrap text-gray-500">
          {format(new Date(discussion.createdAt), 'MMM d, yyyy HH:mm')}
        </span>
      ),
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: 'Engagement',
      accessor: (discussion: Discussion) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-sm">
            <span className="mr-1 text-green-500">+{discussion.upvoteCount}</span>
            <span className="mx-1 text-gray-400">|</span>
            <span className="text-red-500">-{discussion.downvoteCount}</span>
          </div>
          <div className="text-xs text-gray-500">{discussion.commentCount} comments</div>
        </div>
      ),
      sortable: true,
      sortKey: 'voteCount',
    },
    {
      header: 'Actions',
      accessor: (discussion: Discussion) => (
        <div className="relative" ref={discussion.id === activeDropdownId ? dropdownRef : undefined}>
          <button
            className="inline-flex items-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={() => handleToggleDropdown(discussion.id)}
          >
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {isDropdownOpen && discussion.id === activeDropdownId && (
            <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md border border-gray-100 bg-white py-1 shadow-sm">
              <Link
                to={`/discussions/${discussion.id}`}
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="mr-3 h-4 w-4 text-gray-400" />
                View Discussion
              </Link>
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                onClick={() => handleDeletePrompt(discussion)}
              >
                <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                Delete Discussion
              </button>
            </div>
          )}
        </div>
      ),
      className: 'w-16 text-right',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Discussions Management"
        description="Manage forum discussions and content"
        showExportButton
        onExportClick={handleExportDiscussions}
      />

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: filters.search || '',
          onChange: handleSearchChange,
          placeholder: 'Search discussions by content...',
        }}
        onReset={handleResetFilters}
      >
        <SelectFilter
          options={spaces.map((space) => ({ value: space.id, label: space.name }))}
          value={filters.spaceId}
          onChange={handleSpaceFilterChange}
          placeholder="All Spaces"
        />

        <SelectFilter
          options={getAllUniqueTags().map((tag) => ({ value: tag, label: tag }))}
          value={filters.tags ? filters.tags[0] : undefined}
          onChange={(value) => handleTagFilterChange(value ? [value] : undefined)}
          placeholder="All Tags"
        />

        <SelectFilter
          options={[
            { value: true, label: 'Anonymous Only' },
            { value: false, label: 'Non-Anonymous Only' },
          ]}
          value={filters.isAnonymous}
          onChange={handleAnonymousFilterChange}
          placeholder="All Posts"
        />
      </FilterBar>

      {/* Discussions Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={discussions}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          keyExtractor={(discussion) => discussion.id}
          currentSortKey={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          emptyState={{
            icon: <MessageSquare className="h-8 w-8 text-gray-300" />,
            title: 'No discussions found',
            description: "Try adjusting your search or filter to find what you're looking for.",
          }}
        />

        {/* Pagination */}
        {meta && meta.totalPages > 0 && (
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            hasNextPage={meta.hasNextPage}
            hasPreviousPage={meta.hasPreviousPage}
            pageSize={meta.itemsPerPage}
            totalItems={meta.totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handleLimitChange}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Discussion"
        message={
          selectedDiscussion
            ? `Are you sure you want to delete this discussion${
                selectedDiscussion.isAnonymous ? '' : ` by ${selectedDiscussion.author?.fullName}`
              }? This action cannot be undone and will remove all comments associated with this discussion.`
            : 'Are you sure you want to delete this discussion? This action cannot be undone.'
        }
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteDiscussion}
      />
    </div>
  );
};

export default DiscussionManagementPage;

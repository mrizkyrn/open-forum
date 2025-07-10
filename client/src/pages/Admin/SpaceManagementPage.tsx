import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Boxes, Edit, MoreHorizontal, Plus, Trash2, Type } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

import {
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SelectFilter,
  SpaceFormModal,
} from '@/features/admin/components';
import { adminApi } from '@/features/admin/services';
import { useSpaces } from '@/features/spaces/hooks/useSpaces';
import { Space, SpaceType } from '@/features/spaces/types';
import ConfirmationModal from '@/shared/components/modals/ConfirmationModal';
import { useDropdown } from '@/shared/hooks/useDropdown';
import { getFileUrl } from '@/utils/helpers';

const SpaceManagementPage = () => {
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isOpen: isDropdownOpen,
    toggle: toggleDropdown,
    close: closeDropdown,
  } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  const {
    spaces,
    meta,
    isLoading,
    isError,
    filters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleSortChange,
    handleTypeFilterChange,
    handleResetFilters,
  } = useSpaces();

  const labels: Record<SpaceType, string> = {
    [SpaceType.ACADEMIC]: 'Academic',
    [SpaceType.ORGANIZATION]: 'Organization',
    [SpaceType.CAMPUS]: 'Campus',
    [SpaceType.OTHER]: 'Other',
  };

  const colors: Record<SpaceType, { bg: string; text: string }> = {
    [SpaceType.ACADEMIC]: { bg: 'bg-blue-100', text: 'text-blue-700' },
    [SpaceType.ORGANIZATION]: { bg: 'bg-orange-100', text: 'text-orange-700' },
    [SpaceType.CAMPUS]: { bg: 'bg-teal-100', text: 'text-teal-700' },
    [SpaceType.OTHER]: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const handleToggleDropdown = (spaceId: number) => {
    if (activeDropdownId === spaceId) {
      toggleDropdown();
    } else {
      setActiveDropdownId(spaceId);
      setTimeout(() => toggleDropdown(), 0);
    }
  };

  const handleNewSpace = () => {
    setSelectedSpace(null);
    setIsSpaceModalOpen(true);
  };

  const handleEditSpace = (space: Space) => {
    setSelectedSpace(space);
    setIsSpaceModalOpen(true);
    closeDropdown();
  };

  const handleDeletePrompt = (space: Space) => {
    setSelectedSpace(space);
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const handleDeleteSpace = async () => {
    if (selectedSpace) {
      try {
        setIsDeleting(true);
        await adminApi.deleteSpace(selectedSpace.id);
        queryClient.invalidateQueries({ queryKey: ['spaces'] });
        setIsDeleteModalOpen(false);
        toast.success('Space deleted successfully');
      } catch (error) {
        console.error('Error deleting space:', error);
        toast.error((error as Error).message || 'Failed to delete space');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedSpace(null);
  };

  const handleExportSpaces = () => {
    toast.info('Export functionality is not implemented yet');
    // TODO: Implement export functionality
  };

  const columns = [
    {
      header: 'Space',
      accessor: (space: Space) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            {space.iconUrl ? (
              <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-600">
                {space.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-dark text-sm font-medium">{space.name}</div>
            <div className="text-sm text-gray-500">/{space.slug}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Description',
      accessor: (space: Space) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-500">{space.description || 'No description'}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (space: Space) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[space.spaceType].bg} ${colors[space.spaceType].text}`}
        >
          {labels[space.spaceType]}
        </span>
      ),
    },
    {
      header: 'Followers',
      accessor: (space: Space) => space.followerCount,
      className: 'text-gray-500',
      sortable: true,
      sortKey: 'followerCount',
    },
    {
      header: 'Created At',
      accessor: (space: Space) => (
        <span className="whitespace-nowrap">
          {space.createdAt ? format(new Date(space.createdAt), 'MMM d, yyyy') : 'N/A'}
        </span>
      ),
      className: 'text-gray-500',
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: 'Actions',
      accessor: (space: Space) => (
        <div className="relative" ref={space.id === activeDropdownId ? dropdownRef : undefined}>
          <button
            className="inline-flex items-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={() => handleToggleDropdown(space.id)}
          >
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {isDropdownOpen && space.id === activeDropdownId && (
            <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md border border-gray-100 bg-white py-1 shadow-sm">
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleEditSpace(space)}
              >
                <Edit className="mr-3 h-4 w-4 text-gray-400" />
                Edit Space
              </button>
              {space.id !== 1 && (
                <button
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  onClick={() => handleDeletePrompt(space)}
                >
                  <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                  Delete Space
                </button>
              )}
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
        title="Space Management"
        description="Manage forum spaces and their properties"
        showNewButton
        showExportButton
        onNewClick={handleNewSpace}
        onExportClick={handleExportSpaces}
        newButtonText="New Space"
        newButtonIcon={<Plus size={16} />}
      />

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: filters.search || '',
          onChange: handleSearchChange,
          placeholder: 'Search users by name or username...',
        }}
        onReset={handleResetFilters}
      >
        <SelectFilter
          options={Object.values(SpaceType).map((type) => ({
            label: labels[type],
            value: type,
          }))}
          value={filters.spaceType || ''}
          placeholder="All Types"
          onChange={(value) => handleTypeFilterChange(value as SpaceType)}
          leftIcon={<Type size={16} />}
        />
      </FilterBar>

      {/* Spaces Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={spaces}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          keyExtractor={(space) => space.id}
          currentSortKey={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          emptyState={{
            icon: <Boxes className="h-8 w-8 text-gray-300" />,
            title: 'No spaces found',
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

      {/* Modals */}
      <SpaceFormModal
        isOpen={isSpaceModalOpen}
        onClose={() => {
          setIsSpaceModalOpen(false);
          setSelectedSpace(null);
        }}
        space={selectedSpace}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Space"
        message={
          selectedSpace
            ? `Are you sure you want to delete the space "${selectedSpace.name}"? This action cannot be undone and will remove all discussions and content within this space.`
            : 'Are you sure you want to delete this space? This action cannot be undone.'
        }
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteSpace}
      />
    </div>
  );
};

export default SpaceManagementPage;

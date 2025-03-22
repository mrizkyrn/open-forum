import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, Edit, MoreHorizontal, RefreshCw, Trash2, UserCheck, Users } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { adminApi } from '@/features/admin/services/adminApi';
import { useUsers } from '@/features/users/hooks/useUsers';
import { User, UserRole } from '@/features/users/types';
import { useDropdown } from '@/hooks/useDropdown';

// Import our reusable components
import UserAvatar from '@/components/layouts/UserAvatar';
import MainButton from '@/components/ui/buttons/MainButton';
import { DataTable } from '@/features/admin/components/DataTable';
import FilterBar from '@/features/admin/components/FilterBar';
import Pagination from '@/features/admin/components/Pagination';
import StatusBadge from '@/features/admin/components/StatusBadge';
import UserFormModal from '@/features/users/components/UserFormModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isOpen: isDropdownOpen,
    toggle: toggleDropdown,
    close: closeDropdown,
  } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  const {
    users,
    meta,
    isLoading,
    filters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleRoleFilterChange,
    handleSortChange,
  } = useUsers();

  const handleToggleDropdown = (userId: number) => {
    if (activeDropdownId === userId) {
      toggleDropdown();
    } else {
      setActiveDropdownId(userId);
      setTimeout(() => toggleDropdown(), 0);
    }
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
    closeDropdown();
  };

  const handleDeletePrompt = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        setIsDeleting(true);
        await adminApi.deleteUser(selectedUser.id);
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setIsDeleteModalOpen(false);
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.LECTURER:
        return 'blue';
      case UserRole.STUDENT:
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleExportUsers = () => {
    console.log('Export users');
    // Implementation for exporting users
  };

  const columns = [
    {
      header: 'User',
      accessor: (user: User) => (
        <div className="flex items-center">
          <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
          <div className="ml-4">
            <div className="text-sm font-medium text-dark">{user.fullName}</div>
            <div className="text-sm text-gray-500">@{user.username}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'username',
    },
    {
      header: 'Role',
      accessor: (user: User) => <StatusBadge label={user.role} color={getRoleColor(user.role)} />,
      sortable: true,
      sortKey: 'role',
    },
    {
      header: 'Created At',
      accessor: (user: User) => (user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'),
      className: 'text-gray-500 whitespace-nowrap',
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: 'Last Active',
      accessor: (user: User) =>
        user.lastActiveAt ? format(new Date(user.lastActiveAt), 'MMM d, yyyy HH:mm') : 'Never',
      className: 'text-gray-500 whitespace-nowrap',
      sortable: true,
      sortKey: 'lastActiveAt',
    },
    {
      header: 'Actions',
      accessor: (user: User) => (
        <div className="relative" ref={user.id === activeDropdownId ? dropdownRef : undefined}>
          <button
            className="inline-flex items-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={() => handleToggleDropdown(user.id)}
          >
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {isDropdownOpen && user.id === activeDropdownId && (
            <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md border border-gray-100 bg-white py-1 shadow-sm">
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleEditUser(user)}
              >
                <Edit className="mr-3 h-4 w-4 text-gray-400" />
                Edit User
              </button>
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                onClick={() => handleDeletePrompt(user)}
              >
                <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                Delete User
              </button>
            </div>
          )}
        </div>
      ),
      className: 'w-16 text-right',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-dark">Users Management</h1>
          <p className="mt-2 text-sm text-gray-500">Manage user accounts and permissions</p>
        </div>

        {/* Action buttons and filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <MainButton onClick={handleNewUser} leftIcon={<UserCheck size={16} />}>
              New User
            </MainButton>
            <button
              onClick={handleExportUsers}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: filters.search || '',
          onChange: handleSearchChange,
          placeholder: 'Search users by name or username...',
        }}
      >
        <select
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-dark focus:border-blue-500 focus:ring-blue-500"
          value={filters.role || ''}
          onChange={(e) => handleRoleFilterChange(e.target.value as UserRole | undefined)}
        >
          <option value="">All Roles</option>
          <option value={UserRole.ADMIN}>Admin</option>
          <option value={UserRole.LECTURER}>Lecturer</option>
          <option value={UserRole.STUDENT}>Student</option>
        </select>
        <button
          onClick={() => {
            handleSearchChange('');
            handleRoleFilterChange(undefined);
            handleSortChange('createdAt');
          }}
          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Filters
        </button>
      </FilterBar>

      {/* Users Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={users}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(user) => user.id}
          currentSortKey={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          emptyState={{
            icon: <Users className="h-8 w-8 text-gray-300" />,
            title: 'No users found',
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
            pageSizeOptions={[5, 10, 25, 50, 100]}
          />
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete User"
        message={
          selectedUser
            ? `Are you sure you want to delete the user "${selectedUser.fullName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this user? This action cannot be undone.'
        }
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
};

export default UsersPage;

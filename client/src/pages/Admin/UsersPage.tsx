import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Users, Search, Filter, MoreHorizontal, Edit, Trash2, UserCheck, Download, RefreshCw } from 'lucide-react';
import { User, UserRole } from '@/features/users/types';
import { adminApi } from '@/features/admin/services/adminApi';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useDropdown } from '@/hooks/useDropdown';
import MainButton from '@/components/ui/buttons/MainButton';
import AvatarImage from '@/features/users/components/AvatarImage';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import UserFormModal from '@/features/users/components/UserFormModal';

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
    error,
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
        return 'bg-red-100 text-red-700';
      case UserRole.LECTURER:
        return 'bg-blue-100 text-blue-700';
      case UserRole.STUDENT:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleExportUsers = () => {
    console.log('Export users');
  };

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <Users className="h-10 w-10 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">Failed to load users</h3>
        <p className="text-sm text-gray-500">There was a problem loading the user data.</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          className="mt-4 inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <RefreshCw size={16} className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Users Management</h1>
        <MainButton onClick={handleNewUser} leftIcon={<UserCheck size={16} />}>
          New User
        </MainButton>
      </div>

      {/* Filters Section */}
      <div className="rounded-lg border border-gray-100 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-200 py-2 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Role Filter */}
            <div className="relative">
              <select
                value={filters.role || ''}
                onChange={(e) => handleRoleFilterChange(e.target.value ? (e.target.value as UserRole) : undefined)}
                className="appearance-none rounded-md border border-gray-200 bg-white py-2 pr-8 pl-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.LECTURER}>Lecturer</option>
                <option value={UserRole.STUDENT}>Student</option>
              </select>
              <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportUsers}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  onClick={() => handleSortChange('username')}
                >
                  <div className="flex cursor-pointer items-center hover:text-gray-700">
                    User
                    {filters.sortBy === 'username' && (
                      <span className="ml-1">{filters.sortOrder === 'ASC' ? ' ↑' : ' ↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  onClick={() => handleSortChange('role')}
                >
                  <div className="flex cursor-pointer items-center hover:text-gray-700">
                    Role
                    {filters.sortBy === 'role' && (
                      <span className="ml-1">{filters.sortOrder === 'ASC' ? ' ↑' : ' ↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  onClick={() => handleSortChange('createdAt')}
                >
                  <div className="flex cursor-pointer items-center hover:text-gray-700">
                    Created At
                    {filters.sortBy === 'createdAt' && (
                      <span className="ml-1">{filters.sortOrder === 'ASC' ? ' ↑' : ' ↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                  onClick={() => handleSortChange('lastActiveAt')}
                >
                  <div className="flex cursor-pointer items-center hover:text-gray-700">
                    Last Active
                    {filters.sortBy === 'lastActiveAt' && (
                      <span className="ml-1">{filters.sortOrder === 'ASC' ? ' ↑' : ' ↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-300"></div>
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-8 w-8 text-gray-300" />
                      <h3 className="mt-2 text-base font-medium text-gray-900">No users found</h3>
                      <p className="text-gray-500">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <AvatarImage fullName={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${getRoleColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {user.lastActiveAt ? format(new Date(user.lastActiveAt), 'MMM d, yyyy HH:mm') : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <div className="flex items-center text-sm text-gray-500">
              <span className="hidden sm:inline-block">
                Showing <span className="font-medium">{(meta.currentPage - 1) * meta.itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">{Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)}</span>{' '}
                of <span className="font-medium">{meta.totalItems}</span> users
              </span>

              <div className="ml-3 sm:ml-6">
                <label htmlFor="pagination-limit" className="mr-2">
                  Rows:
                </label>
                <select
                  id="pagination-limit"
                  value={filters.limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="rounded border-gray-200 py-1 text-xs"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(meta.currentPage - 1)}
                disabled={!meta.hasPreviousPage}
                className="inline-flex items-center rounded px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              {/* Page Number Buttons - show limited pages with ellipsis */}
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                let pageNumber: number;

                if (meta.totalPages <= 5) {
                  // Show all pages if 5 or fewer
                  pageNumber = i + 1;
                } else if (meta.currentPage <= 3) {
                  // Near the start
                  if (i < 4) {
                    pageNumber = i + 1;
                  } else {
                    pageNumber = meta.totalPages;
                  }
                } else if (meta.currentPage >= meta.totalPages - 2) {
                  // Near the end
                  if (i === 0) {
                    pageNumber = 1;
                  } else {
                    pageNumber = meta.totalPages - 4 + i;
                  }
                } else {
                  // In the middle
                  if (i === 0) {
                    pageNumber = 1;
                  } else if (i === 4) {
                    pageNumber = meta.totalPages;
                  } else {
                    pageNumber = meta.currentPage - 1 + i;
                  }
                }

                // Show ellipsis instead of page numbers
                if ((i === 1 && pageNumber !== 2) || (i === 3 && pageNumber !== meta.totalPages - 1)) {
                  return (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-500">
                      &hellip;
                    </span>
                  );
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                      pageNumber === meta.currentPage ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(meta.currentPage + 1)}
                disabled={!meta.hasNextPage}
                className="inline-flex items-center rounded px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete User"
        message={`Are you sure you want to delete the user "${selectedUser?.fullName}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
};

export default UsersPage;

import { format } from 'date-fns';
import { Bug, CheckCircle, Edit3, MoreHorizontal, Trash2, UserPlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { DataTable, FilterBar, PageHeader, Pagination, SelectFilter, StatusBadge } from '@/features/admin/components';
import {
  useAssignBugReport,
  useBugReports,
  useDeleteBugReport,
  useUpdateBugReportStatus,
} from '@/features/bug-reports';
import { BugPriority, BugPriorityDisplay, BugReport, BugStatus, BugStatusDisplay } from '@/features/bug-reports/types';
import UserAvatar from '@/features/users/components/UserAvatar';
import ConfirmationModal from '@/shared/components/modals/ConfirmationModal';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { useDropdown } from '@/shared/hooks/useDropdown';
import { truncateText } from '@/utils/helpers';

const BugReportManagementPage = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState<number | string>('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BugStatus>(BugStatus.OPEN);
  const [resolution, setResolution] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    isOpen: isDropdownOpen,
    toggle: toggleDropdown,
    close: closeDropdown,
  } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  const {
    bugReports,
    meta,
    isLoading,
    isError,
    filters,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleStatusChange,
    handlePriorityChange,
    handleSortChange,
    resetFilters,
  } = useBugReports();

  const deleteBugReport = useDeleteBugReport();
  const assignBugReport = useAssignBugReport();
  const updateBugReportStatus = useUpdateBugReportStatus();

  const handleToggleDropdown = (bugReportId: number) => {
    if (activeDropdownId === bugReportId) {
      toggleDropdown();
    } else {
      setActiveDropdownId(bugReportId);
      setTimeout(() => toggleDropdown(), 0);
    }
  };

  const handleDeletePrompt = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport);
    setIsDeleteModalOpen(true);
    closeDropdown();
  };

  const handleDeleteBugReport = async () => {
    if (selectedBugReport) {
      try {
        setIsDeleting(true);
        await deleteBugReport.mutateAsync(selectedBugReport.id);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error('Error deleting bug report:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedBugReport(null);
  };

  const handleAssignPrompt = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport);
    setAssigneeId(bugReport.assignedToId || '');
    setShowAssignModal(true);
    closeDropdown();
  };

  const handleAssignSubmit = async () => {
    if (!selectedBugReport) return;

    try {
      await assignBugReport.mutateAsync({
        id: selectedBugReport.id,
        data: { assignedToId: assigneeId ? Number(assigneeId) : null },
      });
      setShowAssignModal(false);
      setSelectedBugReport(null);
      setAssigneeId('');
    } catch (error) {
      console.error('Error assigning bug report:', error);
    }
  };

  const handleAssignCancel = () => {
    setShowAssignModal(false);
    setSelectedBugReport(null);
    setAssigneeId('');
  };

  const handleStatusPrompt = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport);
    setSelectedStatus(bugReport.status);
    setResolution(bugReport.resolution || '');
    setShowStatusModal(true);
    closeDropdown();
  };

  const handleStatusSubmit = async () => {
    if (!selectedBugReport) return;

    try {
      await updateBugReportStatus.mutateAsync({
        id: selectedBugReport.id,
        data: {
          status: selectedStatus,
          ...(resolution.trim() && { resolution: resolution.trim() }),
        },
      });
      setShowStatusModal(false);
      setSelectedBugReport(null);
      setSelectedStatus(BugStatus.OPEN);
      setResolution('');
    } catch (error) {
      console.error('Error updating bug report status:', error);
    }
  };

  const getStatusColor = (status: BugStatus) => {
    switch (status) {
      case BugStatus.OPEN:
        return 'red';
      case BugStatus.IN_PROGRESS:
        return 'yellow';
      case BugStatus.RESOLVED:
        return 'green';
      case BugStatus.CLOSED:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: BugPriority) => {
    switch (priority) {
      case BugPriority.HIGH:
        return 'red';
      case BugPriority.MEDIUM:
        return 'yellow';
      case BugPriority.LOW:
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleExportBugReports = () => {
    toast.info('Export functionality is not implemented yet');
    // TODO: Implement export functionality
  };

  const columns = [
    {
      header: 'Bug Report',
      accessor: (bugReport: BugReport) => (
        <div className="max-w-lg">
          <div className="text-dark font-medium">{truncateText(bugReport.title, 60)}</div>
          <div className="mt-1 text-sm text-gray-500">{truncateText(bugReport.description, 80)}</div>
          <div className="mt-1 flex items-center gap-2"></div>
        </div>
      ),
    },
    {
      header: 'Reporter',
      accessor: (bugReport: BugReport) => (
        <div className="flex items-center">
          <UserAvatar fullName={bugReport.reporter.fullName} avatarUrl={bugReport.reporter.avatarUrl} size="sm" />
          <div className="ml-3">
            <div className="text-dark text-sm font-medium">{bugReport.reporter.fullName}</div>
            <div className="text-xs text-gray-500">@{bugReport.reporter.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned To',
      accessor: (bugReport: BugReport) => (
        <div className="flex items-center">
          {bugReport.assignedTo ? (
            <>
              <UserAvatar
                fullName={bugReport.assignedTo.fullName}
                avatarUrl={bugReport.assignedTo.avatarUrl}
                size="sm"
              />
              <div className="ml-3">
                <div className="text-dark text-sm font-medium">{bugReport.assignedTo.fullName}</div>
                <div className="text-xs text-gray-500">@{bugReport.assignedTo.username}</div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Unassigned</div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (bugReport: BugReport) => (
        <StatusBadge label={BugStatusDisplay[bugReport.status].label} color={getStatusColor(bugReport.status)} />
      ),
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Priority',
      accessor: (bugReport: BugReport) => (
        <StatusBadge
          label={BugPriorityDisplay[bugReport.priority].label}
          color={getPriorityColor(bugReport.priority)}
        />
      ),
      sortable: true,
      sortKey: 'priority',
    },
    {
      header: 'Created',
      accessor: (bugReport: BugReport) => (
        <span className="text-sm whitespace-nowrap text-gray-500">
          {format(new Date(bugReport.createdAt), 'MMM d, yyyy HH:mm')}
        </span>
      ),
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: 'Updated',
      accessor: (bugReport: BugReport) => (
        <span className="text-sm whitespace-nowrap text-gray-500">
          {format(new Date(bugReport.updatedAt), 'MMM d, yyyy HH:mm')}
        </span>
      ),
      sortable: true,
      sortKey: 'updatedAt',
    },
    {
      header: 'Actions',
      accessor: (bugReport: BugReport) => (
        <div className="relative" ref={bugReport.id === activeDropdownId ? dropdownRef : undefined}>
          <button
            className="inline-flex items-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            onClick={() => handleToggleDropdown(bugReport.id)}
          >
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {isDropdownOpen && bugReport.id === activeDropdownId && (
            <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-md border border-gray-100 bg-white py-1 shadow-sm">
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleStatusPrompt(bugReport)}
              >
                <Edit3 className="mr-3 h-4 w-4 text-gray-400" />
                Update Status
              </button>
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => handleAssignPrompt(bugReport)}
              >
                <UserPlus className="mr-3 h-4 w-4 text-gray-400" />
                Assign
              </button>
              <button
                className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                onClick={() => handleDeletePrompt(bugReport)}
              >
                <Trash2 className="mr-3 h-4 w-4 text-red-400" />
                Delete
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
        title="Bug Reports Management"
        description="Manage bug reports and track issues"
        showExportButton
        onExportClick={handleExportBugReports}
      />

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: filters.search || '',
          onChange: handleSearchChange,
          placeholder: 'Search bug reports by title or description...',
        }}
        onReset={resetFilters}
      >
        <SelectFilter
          options={Object.entries(BugStatus).map(([, value]) => ({
            value,
            label: BugStatusDisplay[value].label,
          }))}
          value={filters.status}
          onChange={handleStatusChange}
          placeholder="All Statuses"
        />

        <SelectFilter
          options={Object.entries(BugPriority).map(([, value]) => ({
            value,
            label: BugPriorityDisplay[value].label,
          }))}
          value={filters.priority}
          onChange={handlePriorityChange}
          placeholder="All Priorities"
        />
      </FilterBar>

      {/* Bug Reports Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={bugReports}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          keyExtractor={(bugReport) => bugReport.id}
          currentSortKey={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          emptyState={{
            icon: <Bug className="h-8 w-8 text-gray-300" />,
            title: 'No bug reports found',
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
        title="Delete Bug Report"
        message={
          selectedBugReport
            ? `Are you sure you want to delete the bug report "${selectedBugReport.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this bug report? This action cannot be undone.'
        }
        confirmButtonText="Delete"
        variant="danger"
        isProcessing={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteBugReport}
      />

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={handleAssignCancel} size="md">
        <ModalHeader title="Assign Bug Report" onClose={handleAssignCancel} />
        <ModalBody>
          {selectedBugReport && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-gray-600">
                  Assigning bug report: <span className="font-medium">{selectedBugReport.title}</span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Assignee (User ID)</label>
                <input
                  type="number"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter user ID or leave empty to unassign"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {assigneeId ? `Assigning to user ID: ${assigneeId}` : 'Leave empty to unassign the bug report'}
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <MainButton onClick={handleAssignCancel} variant="outline">
            Cancel
          </MainButton>
          <MainButton
            onClick={handleAssignSubmit}
            disabled={assignBugReport.isPending}
            isLoading={assignBugReport.isPending}
            leftIcon={<UserPlus size={18} />}
          >
            {assignBugReport.isPending ? 'Assigning...' : 'Assign'}
          </MainButton>
        </ModalFooter>
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} size="md">
        <ModalHeader title="Update Bug Report Status" onClose={() => setShowStatusModal(false)} />
        <ModalBody>
          {selectedBugReport && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-gray-600">
                  Updating status for: <span className="font-medium">{selectedBugReport.title}</span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BugStatus)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.entries(BugStatus).map(([, value]) => (
                    <option key={value} value={value}>
                      {BugStatusDisplay[value].label}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedStatus === BugStatus.RESOLVED || selectedStatus === BugStatus.CLOSED) && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Resolution {selectedStatus === BugStatus.RESOLVED && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Describe how this issue was resolved..."
                  />
                  {selectedStatus === BugStatus.RESOLVED && (
                    <p className="mt-1 text-xs text-gray-500">Resolution is required for resolved status</p>
                  )}
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <MainButton onClick={() => setShowStatusModal(false)} variant="outline">
            Cancel
          </MainButton>
          <MainButton
            onClick={handleStatusSubmit}
            disabled={updateBugReportStatus.isPending || (selectedStatus === BugStatus.RESOLVED && !resolution.trim())}
            isLoading={updateBugReportStatus.isPending}
            leftIcon={<CheckCircle size={18} />}
          >
            {updateBugReportStatus.isPending ? 'Updating...' : 'Update Status'}
          </MainButton>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default BugReportManagementPage;

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Pagination } from '@/features/admin/components';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBugReports, useDeleteBugReport } from '@/features/bug-reports';
import {
  BugReportFilters,
  BugReportList,
  CreateBugReportModal,
  UpdateBugReportModal,
} from '@/features/bug-reports/components';
import { BugReport } from '@/features/bug-reports/types';
import ConfirmationModal from '@/shared/components/modals/ConfirmationModal';
import MainButton from '@/shared/components/ui/buttons/MainButton';

const BugReportsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const deleteBugReport = useDeleteBugReport();

  const {
    bugReports,
    meta,
    isLoading,
    filters,
    handleSearchChange,
    handleStatusChange,
    handlePriorityChange,
    handleSortChange,
    resetFilters,
    handlePageChange,
    handleLimitChange,
  } = useBugReports({
    reporterId: user?.id,
  });

  const handleEditBugReport = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport);
    setShowEditModal(true);
  };

  const handleDeleteBugReport = (bugReport: BugReport) => {
    setSelectedBugReport(bugReport);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBugReport) return;

    try {
      setIsDeleting(true);
      await deleteBugReport.mutateAsync(selectedBugReport.id);
      setShowDeleteModal(false);
      setSelectedBugReport(null);
    } catch (error) {
      console.error('Error deleting bug report:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedBugReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Bug Reports</h1>
        <MainButton onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />} variant="danger">
          Report Bug
        </MainButton>
      </div>

      {/* Filters */}
      <BugReportFilters
        search={filters.search || ''}
        status={filters.status}
        priority={filters.priority}
        sortBy={filters.sortBy!}
        sortOrder={filters.sortOrder!}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onSortChange={handleSortChange}
        onResetFilters={resetFilters}
      />

      {/* Bug Reports List */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <BugReportList
          bugReports={bugReports}
          isLoading={isLoading}
          showActions={true}
          onEdit={handleEditBugReport}
          onDelete={handleDeleteBugReport}
        />

        {/* Pagination */}
        {meta && meta.totalItems > 0 && (
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

      {/* Create Bug Report Modal */}
      <CreateBugReportModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Update Bug Report Modal */}
      {selectedBugReport && (
        <UpdateBugReportModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          bugReport={selectedBugReport}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
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
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default BugReportsPage;

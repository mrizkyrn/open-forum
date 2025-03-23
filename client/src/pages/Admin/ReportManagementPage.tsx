import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, Flag, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

import UserAvatar from '@/components/layouts/UserAvatar';
import { DataTable } from '@/features/admin/components/DataTable';
import FilterBar from '@/features/admin/components/FilterBar';
import Pagination from '@/features/admin/components/Pagination';
import ReportDetailModal from '@/features/admin/components/ReportDetailModal';
import StatsCard from '@/features/admin/components/StatsCard';
import StatusBadge from '@/features/admin/components/StatusBadge';
import { useReports } from '@/features/reports/hooks/useReports';
import { reportApi } from '@/features/reports/services';
import { Report, ReportStatus, ReportTargetType } from '@/features/reports/types';

const ReportManagementPage = () => {
  // State for report detail modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Use the reports hook for data fetching and filtering
  const {
    reports,
    meta,
    isLoading,
    isError,
    filters,
    refetch,
    handlePageChange,
    handleLimitChange,
    handleSearchChange,
    handleStatusFilterChange,
    handleTypeFilterChange,
    handleSortChange,
    resetFilters,
  } = useReports();

  // Fetch report statistics
  const { data: reportStats } = useQuery({
    queryKey: ['reportStats'],
    queryFn: reportApi.getReportStats,
  });

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
  };

  const closeReportDetail = () => {
    setSelectedReport(null);
    refetch();
  };

  const columns = [
    {
      header: 'Report',
      accessor: (report: Report) => (
        <div>
          <div className="max-w-xs truncate font-medium">{report.reason.name}</div>
          <div className="mt-1 line-clamp-1 max-w-xs text-xs text-gray-500">
            {report.description || report.reason.description}
          </div>
        </div>
      ),
    },
    {
      header: 'Reporter',
      accessor: (report: Report) => (
        <div className="flex items-center gap-2">
          <UserAvatar fullName={report.reporter.fullName} avatarUrl={report.reporter.avatarUrl} size="sm" />
          <span>{report.reporter.username}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (report: Report) => {
        switch (report.targetType) {
          case ReportTargetType.DISCUSSION:
            return <StatusBadge label="Discussion" color="blue" />;
          case ReportTargetType.COMMENT:
            return <StatusBadge label="Comment" color="purple" />;
          default:
            return <StatusBadge label={report.targetType} color="gray" />;
        }
      },
      sortable: true,
      sortKey: 'targetType',
    },
    {
      header: 'Status',
      accessor: (report: Report) => {
        switch (report.status) {
          case ReportStatus.PENDING:
            return <StatusBadge label="Pending" icon={<AlertTriangle size={12} />} color="yellow" />;
          case ReportStatus.RESOLVED:
            return <StatusBadge label="Resolved" icon={<CheckCircle size={12} />} color="green" />;
          case ReportStatus.DISMISSED:
            return <StatusBadge label="Dismissed" icon={<X size={12} />} color="gray" />;
          default:
            return <StatusBadge label={report.status} color="gray" />;
        }
      },
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Submitted',
      accessor: (report: Report) => format(new Date(report.createdAt), 'MMM d, yyyy HH:mm'),
      className: 'text-gray-500 whitespace-nowrap',
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: 'Reviewed',
      accessor: (report: Report) =>
        report.reviewedAt ? format(new Date(report.reviewedAt), 'MMM d, yyyy HH:mm') : 'Not reviewed',
      className: 'text-gray-500 whitespace-nowrap',
      sortable: true,
      sortKey: 'reviewedAt',
    },
    {
      header: 'Actions',
      accessor: (report: Report) => (
        <button
          onClick={() => handleViewReport(report)}
          className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100"
        >
          Review
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reports Management</h1>
        <p className="mt-2 text-sm text-gray-500">Review and manage user reports of inappropriate content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Reports"
          value={reportStats?.total || 0}
          icon={<Flag size={20} />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Pending"
          value={reportStats?.pending || 0}
          icon={<AlertTriangle size={20} />}
          iconBgColor="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatsCard
          title="Resolved"
          value={reportStats?.resolved || 0}
          icon={<CheckCircle size={20} />}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Dismissed"
          value={reportStats?.dismissed || 0}
          icon={<X size={20} />}
          iconBgColor="bg-gray-50"
          iconColor="text-gray-600"
        />
      </div>

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: filters.search || '',
          onChange: handleSearchChange,
          placeholder: 'Search reports...',
        }}
      >
        <select
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          value={filters.status || ''}
          onChange={(e) => handleStatusFilterChange((e.target.value as ReportStatus) || undefined)}
        >
          <option value="">All Statuses</option>
          <option value={ReportStatus.PENDING}>Pending</option>
          <option value={ReportStatus.RESOLVED}>Resolved</option>
          <option value={ReportStatus.DISMISSED}>Dismissed</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          value={filters.targetType || ''}
          onChange={(e) => handleTypeFilterChange((e.target.value as ReportTargetType) || undefined)}
        >
          <option value="">All Types</option>
          <option value={ReportTargetType.DISCUSSION}>Discussions</option>
          <option value={ReportTargetType.COMMENT}>Comments</option>
        </select>
        <button
          onClick={resetFilters}
          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Filters
        </button>
      </FilterBar>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={reports}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          keyExtractor={(report) => report.id}
          currentSortKey={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          emptyState={{
            icon: <Flag className="mb-2 h-10 w-10 text-gray-400" />,
            title: 'No reports found',
            description: 'No reports match your current filters',
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

      {/* Report Detail Modal */}
      <ReportDetailModal isOpen={!!selectedReport} onClose={closeReportDetail} report={selectedReport} />
    </div>
  );
};

export default ReportManagementPage;

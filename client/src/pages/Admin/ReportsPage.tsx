import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flag, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';

import { reportApi } from '@/features/reports/services/reportApi';
import { Report, ReportStatus, ReportTargetType } from '@/features/reports/types';
// import ReportDetailModal from '@/features/reports/components/ReportDetailModal';
import { DataTable } from '@/features/admin/components/DataTable';
import Pagination from '@/features/admin/components/Pagination';
import StatusBadge from '@/features/admin/components/StatusBadge';
import FilterBar from '@/features/admin/components/FilterBar';
import StatsCard from '@/features/admin/components/StatsCard';
import AvatarImage from '@/features/users/components/AvatarImage';
import ReportDetailModal from '@/features/admin/components/ReportDetailModal';

const ReportsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReportTargetType | ''>('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch reports with filters
  const {
    data: reportsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminReports', currentPage, pageSize, debouncedSearchTerm, statusFilter, typeFilter],
    queryFn: () => reportApi.getReports(),
  });

  // Fetch report statistics
  const { data: reportStats } = useQuery({
    queryKey: ['reportStats'],
    queryFn: reportApi.getReportStats,
  });

  const handleStatusChange = (status: ReportStatus | '') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: ReportTargetType | '') => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
          <AvatarImage fullName={report.reporter.fullName} avatarUrl={report.reporter.avatarUrl} size="sm" />
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
    },
    {
      header: 'Date',
      accessor: (report: Report) => formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }),
      className: 'text-gray-500',
    },
    {
      header: 'Actions',
      accessor: (report: Report) => (
        <button onClick={() => handleViewReport(report)} className="text-blue-600 hover:text-blue-900">
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
          value: searchTerm,
          onChange: handleSearchChange,
          placeholder: 'Search reports...',
        }}
      >
        <select
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as ReportStatus | '')}
        >
          <option value="">All Statuses</option>
          <option value={ReportStatus.PENDING}>Pending</option>
          <option value={ReportStatus.RESOLVED}>Resolved</option>
          <option value={ReportStatus.DISMISSED}>Dismissed</option>
        </select>
        <select
          className="rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          value={typeFilter}
          onChange={(e) => handleTypeChange(e.target.value as ReportTargetType | '')}
        >
          <option value="">All Types</option>
          <option value={ReportTargetType.DISCUSSION}>Discussions</option>
          <option value={ReportTargetType.COMMENT}>Comments</option>
        </select>
      </FilterBar>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={reportsData?.items}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          keyExtractor={(report) => report.id}
          emptyState={{
            icon: <Flag className="mb-2 h-10 w-10 text-gray-400" />,
            title: 'No reports found',
            description: 'No reports match your current filters',
          }}
        />

        {/* Pagination */}
        {reportsData && reportsData.meta.totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={reportsData.meta.totalPages}
            hasNextPage={reportsData.meta.hasNextPage}
            hasPreviousPage={reportsData.meta.hasPreviousPage}
            pageSize={pageSize}
            totalItems={reportsData.meta.totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 25, 50, 100]}
          />
        )}
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal isOpen={!!selectedReport} onClose={closeReportDetail} report={selectedReport} />
    </div>
  );
};

export default ReportsPage;

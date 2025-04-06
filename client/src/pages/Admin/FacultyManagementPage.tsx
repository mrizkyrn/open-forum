import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BookOpen, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { academicApi } from '@/features/academic/services';
import { DataTable } from '@/features/admin/components/DataTable';
import FilterBar from '@/features/admin/components/FilterBar';
import PageHeader from '@/features/admin/components/PageHeader';
import Pagination from '@/features/admin/components/Pagination';
import { adminApi } from '@/features/admin/services';
import { useDebounce } from '@/hooks/useDebounce';

interface Faculty {
  id: number;
  facultyCode: string;
  facultyName: string;
  facultyAbbreviation: string;
  deanName: string | null;
  viceDean1Name: string | null;
  viceDean2Name: string | null;
  viceDean3Name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const FacultyManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
  });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: debouncedSearchTerm,
    }));
  }, [debouncedSearchTerm]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['faculties', filters],
    queryFn: () => academicApi.getFaculties(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const faculties = data?.items || [];
  const meta = data?.meta;

  // Filter handlers
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, page: 1, limit }));
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
  };

  const handleSyncFaculties = async () => {
    try {
      await adminApi.syncFaculties();
      toast.success('Faculties synchronized successfully!');
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage || 'Failed to synchronize faculties');
    }
  };

  const handleExportFaculties = () => {
    console.log('Export faculties');
    // Implementation for exporting faculties
  };

  // Table columns
  const columns = [
    {
      header: 'Faculty Name',
      accessor: (faculty: Faculty) => (
        <div>
          <div className="text-dark min-w-28 text-sm font-medium">{faculty.facultyName}</div>
          <div className="text-sm text-gray-500">{faculty.facultyAbbreviation}</div>
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: (faculty: Faculty) => faculty.facultyCode,
      className: 'text-gray-500',
    },
    {
      header: 'Dean',
      accessor: (faculty: Faculty) => faculty.deanName || 'Not assigned',
      className: 'text-gray-500',
    },
    {
      header: 'Vice Dean 1',
      accessor: (faculty: Faculty) => faculty.viceDean1Name || 'Not assigned',
      className: 'text-gray-500',
    },
    {
      header: 'Vice Dean 2',
      accessor: (faculty: Faculty) => faculty.viceDean2Name || 'Not assigned',
      className: 'text-gray-500',
    },
    {
      header: 'Vice Dean 3',
      accessor: (faculty: Faculty) => faculty.viceDean3Name || 'Not assigned',
      className: 'text-gray-500',
    },
    {
      header: 'Last Sync',
      accessor: (faculty: Faculty) => (
        <span className="whitespace-nowrap">{format(new Date(faculty.updatedAt), 'MMM d, yyyy')}</span>
      ),
      className: 'text-gray-500',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Faculty Management"
        description="Manage university faculties and academic units"
        showNewButton
        showExportButton
        onNewClick={handleSyncFaculties}
        onExportClick={handleExportFaculties}
        newButtonText="Syncronize"
        newButtonIcon={<RefreshCcw size={16} />}
      />

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: searchTerm,
          onChange: handleSearchChange,
          placeholder: 'Search faculties by name or code...',
        }}
      />

      {/* Faculties Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={faculties}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          keyExtractor={(faculty) => faculty.id}
          emptyState={{
            icon: <BookOpen className="h-8 w-8 text-gray-300" />,
            title: 'No faculties found',
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
    </div>
  );
};

export default FacultyManagementPage;

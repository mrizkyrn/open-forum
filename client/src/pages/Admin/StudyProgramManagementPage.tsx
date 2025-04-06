import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { BookOpen, Building, GraduationCap, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { academicApi } from '@/features/academic/services';
import { StudyProgram, StudyProgramSortBy } from '@/features/academic/types';
import { DataTable } from '@/features/admin/components/DataTable';
import FilterBar from '@/features/admin/components/FilterBar';
import PageHeader from '@/features/admin/components/PageHeader';
import Pagination from '@/features/admin/components/Pagination';
import SelectFilter from '@/features/admin/components/SelectFilter';
import { adminApi } from '@/features/admin/services';
import { useDebounce } from '@/hooks/useDebounce';
import { SortOrder } from '@/types/SearchTypes';

const EDUCATION_LEVELS = [
  { label: 'S1', value: 'S1' },
  { label: 'S2', value: 'S2' },
  { label: 'S3', value: 'S3' },
  { label: 'Profesi', value: 'Profesi' },
  { label: 'DIII', value: 'DIII' },
  { label: 'Sp1', value: 'Sp1' },
];

const StudyProgramManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    facultyId: undefined as number | undefined,
    educationLevel: undefined as string | undefined,
    sortBy: undefined as StudyProgramSortBy | undefined,
    sortOrder: undefined as SortOrder | undefined,
  });

  // Fetch faculties for dropdown
  const { data: facultiesData } = useQuery({
    queryKey: ['faculties', { limit: 100 }],
    queryFn: () => academicApi.getFaculties({ limit: 100 }),
  });

  const faculties = facultiesData?.items || [];

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: debouncedSearchTerm,
    }));
  }, [debouncedSearchTerm]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['studyPrograms', filters],
    queryFn: () => academicApi.getStudyPrograms(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const studyPrograms = data?.items || [];
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

  const handleFacultyFilterChange = (facultyId: number | undefined) => {
    setFilters((prev) => ({ ...prev, page: 1, facultyId }));
  };

  const handleEducationLevelFilterChange = (educationLevel: string | undefined) => {
    setFilters((prev) => ({ ...prev, page: 1, educationLevel }));
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder =
      filters.sortBy === sortBy && filters.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;

    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as StudyProgramSortBy,
      sortOrder: newSortOrder as SortOrder,
    }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      facultyId: undefined,
      educationLevel: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  };

  const handleSyncStudyPrograms = async () => {
    try {
      await adminApi.syncStudyPrograms();
      toast.success('Study programs synchronized successfully!');
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage || 'Failed to synchronize study programs');
    }
  };

  const handleExportStudyPrograms = () => {
    console.log('Export study programs');
    // Implementation for exporting study programs
  };

  // Table columns
  const columns = [
    {
      header: 'Study Program',
      accessor: (program: StudyProgram) => (
        <div>
          <div className="text-dark min-w-28 text-sm font-medium">{program.studyProgramName}</div>
          <div className="text-sm text-gray-500">{program.educationLevel || 'Unknown'}</div>
        </div>
      ),
      sortable: true,
      sortKey: StudyProgramSortBy.studyProgramName,
    },
    {
      header: 'Code',
      accessor: (program: StudyProgram) => program.studyProgramCode,
      className: 'text-gray-500',
      sortable: true,
      sortKey: StudyProgramSortBy.studyProgramCode,
    },
    {
      header: 'Faculty',
      accessor: (program: StudyProgram) => {
        const faculty = faculties.find((f) => f.id === program.facultyId);
        return faculty ? faculty.facultyAbbreviation || faculty.facultyName : program.facultyId;
      },
      className: 'text-gray-500',
    },
    {
      header: 'Program Director',
      accessor: (program: StudyProgram) => program.directorName || 'Not assigned',
      className: 'text-gray-500',
    },
    {
      header: 'Education Level',
      accessor: (program: StudyProgram) => program.educationLevel || 'Unknown',
      className: 'text-gray-500',
      sortable: true,
      sortKey: StudyProgramSortBy.educationLevel,
    },
    {
      header: 'Last Sync',
      accessor: (program: StudyProgram) => (
        <span className="whitespace-nowrap">{format(new Date(program.updatedAt), 'MMM d, yyyy')}</span>
      ),
      className: 'text-gray-500',
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Study Program Management"
        description="Manage university study programs and academic degrees"
        showNewButton
        showExportButton
        onNewClick={handleSyncStudyPrograms}
        onExportClick={handleExportStudyPrograms}
        newButtonText="Synchronize"
        newButtonIcon={<RefreshCcw size={16} />}
      />

      {/* Filters */}
      <FilterBar
        searchProps={{
          value: searchTerm,
          onChange: handleSearchChange,
          placeholder: 'Search study programs by name or code...',
        }}
        onReset={handleResetFilters}
      >
        <SelectFilter
          options={faculties.map((faculty) => ({
            label: faculty.facultyAbbreviation || faculty.facultyName,
            value: faculty.id,
          }))}
          value={filters.facultyId || ''}
          placeholder="All Faculties"
          onChange={(value) => handleFacultyFilterChange(value ? Number(value) : undefined)}
          leftIcon={<Building size={16} />}
        />
        <SelectFilter
          options={EDUCATION_LEVELS}
          value={filters.educationLevel || ''}
          placeholder="All Education Levels"
          onChange={(value) => handleEducationLevelFilterChange(value as string | undefined)}
          leftIcon={<GraduationCap size={16} />}
        />
      </FilterBar>

      {/* Study Programs Table */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <DataTable
          data={studyPrograms}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          keyExtractor={(program) => program.id}
          currentSortKey={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSortChange={handleSortChange}
          emptyState={{
            icon: <BookOpen className="h-8 w-8 text-gray-300" />,
            title: 'No study programs found',
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

export default StudyProgramManagementPage;

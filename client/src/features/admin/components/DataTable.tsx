import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import { ReactNode } from 'react';

interface Column<T> {
  header: string | ReactNode;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  sortable?: boolean;
  sortKey?: string;
}

interface DataTableProps<T> {
  data?: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyState?: {
    icon: ReactNode;
    title: string;
    description: string;
  };
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  currentSortKey?: string;
  sortOrder?: 'ASC' | 'DESC';
  onSortChange?: (sortKey: string) => void;
}

export function DataTable<T>({
  data = [],
  columns,
  isLoading = false,
  isError = false,
  onRetry,
  emptyState,
  keyExtractor,
  onRowClick,
  currentSortKey,
  sortOrder,
  onSortChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingIndicator fullWidth className="h-64" type="dots" />;
  }

  if (isError) {
    return (
      <FeedbackDisplay
        title="Error loading data"
        description="An error occurred while loading the data. Please try again."
        variant="error"
        size="md"
        actions={[
          {
            label: 'Retry',
            onClick: onRetry,
            variant: 'outline',
          },
        ]}
        className="h-64"
      />
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <FeedbackDisplay
          title={emptyState.title}
          description={emptyState.description}
          icon={emptyState.icon}
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase ${
                  column.className || ''
                }`}
                onClick={
                  column.sortable && onSortChange && column.sortKey ? () => onSortChange(column.sortKey!) : undefined
                }
              >
                {typeof column.header === 'string' && column.sortable ? (
                  <div
                    className={`flex cursor-pointer items-center hover:text-gray-700 ${
                      column.sortKey === currentSortKey ? 'text-gray-900' : ''
                    }`}
                  >
                    {column.header}
                    {column.sortKey === currentSortKey && (
                      <span className="ml-1">{sortOrder === 'ASC' ? ' ↑' : ' ↓'}</span>
                    )}
                  </div>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column, index) => (
                <td key={index} className={`px-6 py-4 ${column.className || ''}`}>
                  {typeof column.accessor === 'function' ? column.accessor(item) : (item[column.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { ReactNode } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

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
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Loading data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <AlertTriangle className="mb-2 h-10 w-10 text-red-500" />
        <p className="text-lg font-medium text-gray-900">Failed to load data</p>
        <p className="text-sm text-gray-500">Please try refreshing the page</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        {emptyState.icon}
        <p className="text-lg font-medium text-gray-900">{emptyState.title}</p>
        <p className="text-sm text-gray-500">{emptyState.description}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
                  column.sortable && onSortChange && column.sortKey
                    ? () => onSortChange(column.sortKey!)
                    : undefined
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
                  {typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : (item[column.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /**
   * Current active page (1-based)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there is a next page available
   */
  hasNextPage: boolean;

  /**
   * Whether there is a previous page available
   */
  hasPreviousPage: boolean;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Called when the user changes the page
   */
  onPageChange: (page: number) => void;

  /**
   * Called when the user changes the page size
   */
  onPageSizeChange?: (pageSize: number) => void;

  /**
   * Available page size options
   */
  pageSizeOptions?: number[];

  /**
   * Maximum number of page buttons to show (odd number recommended)
   */
  maxPageButtons?: number;
}

/**
 * A reusable pagination component that handles page navigation and page size selection
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  maxPageButtons = 5,
}) => {
  // Calculate starting and ending items on the current page
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate array of page buttons to display
  const getPageButtons = () => {
    const buttons: (number | 'ellipsis')[] = [];

    // If few enough pages to show all
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
      return buttons;
    }

    // Always show first page
    buttons.push(1);

    // Calculate range to display (accounting for first and last pages that are always shown)
    const maxMiddleButtons = maxPageButtons - 2; // -2 for first and last pages
    const halfRange = Math.floor(maxMiddleButtons / 2);

    // Calculate the ideal range around current page
    let startPage = Math.max(2, currentPage - halfRange);
    let endPage = Math.min(totalPages - 1, startPage + maxMiddleButtons - 1);

    // Adjust start if end is too close to totalPages
    if (endPage >= totalPages - 1) {
      startPage = Math.max(2, totalPages - maxMiddleButtons);
      endPage = totalPages - 1;
    }

    // Add ellipsis before middle pages if needed
    if (startPage > 2) {
      buttons.push('ellipsis');
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    // Add ellipsis after middle pages if needed
    if (endPage < totalPages - 1) {
      buttons.push('ellipsis');
    }

    // Always show last page if more than one page
    if (totalPages > 1) {
      buttons.push(totalPages);
    }

    return buttons;
  };

  if (totalPages <= 0) return null;

  return (
    <div className="flex flex-col-reverse gap-4 border-t border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
      {/* Page size selector and info text */}
      <div className="text-md flex flex-col space-y-2 text-sm text-gray-700 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <span>
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </span>

        {onPageSizeChange && (
          <div className="flex items-center space-x-2 text-sm">
            <label htmlFor="page-size" className="whitespace-nowrap">
              Items per page:
            </label>
            <select
              id="page-size"
              className="text-md block rounded-md border-gray-300 py-1 pr-8 pl-2 focus:border-blue-500 focus:ring-blue-500"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page navigation */}
      <nav className="flex items-center justify-between" aria-label="Pagination">
        {/* Page size selector and info text */}
        <div className="md:flex md:flex-1 md:items-center md:justify-end">
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
              {/* Previous page button */}
              <button
                onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
                className={`text-md relative inline-flex items-center rounded-l-md border border-gray-300 bg-white p-2 font-medium ${
                  hasPreviousPage ? 'text-gray-500 hover:bg-gray-50' : 'cursor-not-allowed text-gray-300'
                }`}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              {/* Page buttons */}
              {getPageButtons().map((page, idx) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="text-md relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700"
                  >
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                    className={`relative inline-flex items-center border px-4 py-2 text-xs font-medium ${
                      page === currentPage
                        ? 'z-10 border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              {/* Next page button */}
              <button
                onClick={() => hasNextPage && onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className={`text-md relative inline-flex items-center rounded-r-md border border-gray-300 bg-white p-2 font-medium ${
                  hasNextPage ? 'text-gray-500 hover:bg-gray-50' : 'cursor-not-allowed text-gray-300'
                }`}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Pagination;

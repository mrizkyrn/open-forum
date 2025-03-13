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
  pageSizeOptions = [5, 10, 25, 50, 100],
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

    // Calculate start and end of page range around current page
    let startPage = Math.max(2, currentPage - Math.floor(maxPageButtons / 2) + 1);
    let endPage = startPage + maxPageButtons - 3; // -3 for first, last, and one ellipsis

    // Adjust if end page is beyond total pages
    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(2, endPage - maxPageButtons + 3);
    }

    // Add ellipsis if needed before middle pages
    if (startPage > 2) {
      buttons.push('ellipsis');
    } else if (startPage === 2) {
      buttons.push(2);
    }

    // Add middle pages
    for (let i = Math.max(startPage, 2); i <= Math.min(endPage, totalPages - 1); i++) {
      buttons.push(i);
    }

    // Add ellipsis if needed after middle pages
    if (endPage < totalPages - 1) {
      buttons.push('ellipsis');
    } else if (endPage === totalPages - 1) {
      buttons.push(totalPages - 1);
    }

    // Always show last page if more than one page
    if (totalPages > 1) {
      buttons.push(totalPages);
    }

    return buttons;
  };

  if (totalPages <= 0) return null;

  return (
    <div className="flex flex-col-reverse gap-4 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      {/* Page size selector and info text */}
      <div className="flex flex-col space-y-2 text-sm text-gray-700 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <span>
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </span>

        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <label htmlFor="page-size" className="whitespace-nowrap">
              Items per page:
            </label>
            <select
              id="page-size"
              className="block rounded-md border-gray-300 py-1 pr-8 pl-2 text-sm focus:border-blue-500 focus:ring-blue-500"
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
        <div className="flex flex-1 justify-between sm:hidden">
          {/* Mobile view: simplified prev/next only */}
          <button
            onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              hasPreviousPage ? 'text-gray-700 hover:bg-gray-50' : 'cursor-not-allowed text-gray-400'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => hasNextPage && onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              hasNextPage ? 'text-gray-700 hover:bg-gray-50' : 'cursor-not-allowed text-gray-400'
            }`}
          >
            Next
          </button>
        </div>

        {/* Desktop view: full pagination */}
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end">
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              {/* Previous page button */}
              <button
                onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
                disabled={!hasPreviousPage}
                className={`relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                  hasPreviousPage ? 'text-gray-500 hover:bg-gray-50' : 'cursor-not-allowed text-gray-300'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              {/* Page buttons */}
              {getPageButtons().map((page, idx) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                    className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
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
                className={`relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium ${
                  hasNextPage ? 'text-gray-500 hover:bg-gray-50' : 'cursor-not-allowed text-gray-300'
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Pagination;

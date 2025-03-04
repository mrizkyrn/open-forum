export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface BaseQueryParams extends PaginationParams {
  sortOrder?: SortOrder;
  search?: string;
}

export interface SearchDto {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: SortOrder;
}

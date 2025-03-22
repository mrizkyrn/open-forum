export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface SearchDto {
  page: number;
  limit: number;
  search?: string;
  sortOrder: SortOrder;
}

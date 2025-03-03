import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items', example: 1 })
  totalItems: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  itemsPerPage: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: false })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPreviousPage: boolean;
}

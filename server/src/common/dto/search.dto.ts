import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SearchDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term (will be applied to relevant fields)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort direction',
    enum: SortOrder,
    default: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}

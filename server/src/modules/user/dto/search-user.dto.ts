// import {
//   IsBoolean,
//   IsEnum,
//   IsNumber,
//   IsOptional,
//   IsString,
// } from 'class-validator';
// import { SearchDto } from 'src/common/dtos/search.dto';

// export enum SortBy {
//   createdAt = 'createdAt',
//   updatedAt = 'updatedAt',
// }

// export class SearchUserDto extends SearchDto {
//   @IsOptional()
//   @IsString()
//   role?: string;

//   @IsOptional()
//   @IsString()
//   sortBy: SortBy = SortBy.createdAt;
// }

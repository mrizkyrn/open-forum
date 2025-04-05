import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SearchDto } from '../../../common/dto/search.dto';

export enum StudyProgramSortBy {
  studyProgramName = 'studyProgramName',
  studyProgramCode = 'studyProgramCode',
  educationLevel = 'educationLevel',
}

export class SearchStudyProgramDto extends SearchDto {
  @ApiProperty({
    description: 'Filter by faculty ID',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  facultyId?: number;

  @ApiProperty({
    description: 'Filter by education level',
    example: 'S.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: StudyProgramSortBy.studyProgramName,
    required: false,
    enum: StudyProgramSortBy,
    default: StudyProgramSortBy.studyProgramCode,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StudyProgramSortBy)
  sortBy: StudyProgramSortBy = StudyProgramSortBy.studyProgramCode;
}

import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { Faculty } from '../entity/faculty.entity';

export class FacultyResponseDto {
  @ApiProperty({ description: 'Faculty ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Faculty code', example: '5' })
  facultyCode: string;

  @ApiProperty({ description: 'Faculty name', example: 'Fakultas Ilmu Komputer' })
  facultyName: string;

  @ApiProperty({ description: 'Faculty abbreviation', example: 'FILKOM' })
  facultyAbbreviation: string;

  @ApiProperty({ description: 'Dean name', example: 'Dr. John Doe', nullable: true })
  deanName: string | null;

  @ApiProperty({ description: 'Vice Dean 1 name', example: 'Dr. Jane Smith', nullable: true })
  viceDean1Name: string | null;

  @ApiProperty({ description: 'Vice Dean 2 name', example: 'Dr. Eric Brown', nullable: true })
  viceDean2Name: string | null;

  @ApiProperty({ description: 'Vice Dean 3 name', example: 'Dr. Lisa Johnson', nullable: true })
  viceDean3Name: string | null;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;

  static fromEntity(faculty: Faculty): FacultyResponseDto {
    const dto = new FacultyResponseDto();
    dto.id = faculty.id;
    dto.facultyCode = faculty.facultyCode;
    dto.facultyName = faculty.facultyName;
    dto.facultyAbbreviation = faculty.facultyAbbreviation;
    dto.deanName = faculty.deanName;
    dto.viceDean1Name = faculty.viceDean1Name;
    dto.viceDean2Name = faculty.viceDean2Name;
    dto.viceDean3Name = faculty.viceDean3Name;
    dto.createdAt = faculty.createdAt;
    dto.updatedAt = faculty.updatedAt;
    return dto;
  }
}

export class PageableFacultyResponseDto {
  @ApiProperty({
    type: FacultyResponseDto,
    description: 'List of faculties',
    isArray: true,
  })
  items: FacultyResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}

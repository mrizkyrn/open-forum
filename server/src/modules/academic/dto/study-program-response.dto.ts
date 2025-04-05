import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { StudyProgram } from '../entity/study-program.entity';
import { FacultyResponseDto } from './faculty-response.dto';

export class StudyProgramResponseDto {
  @ApiProperty({ description: 'Study Program ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Study Program code', example: '511' })
  studyProgramCode: string;

  @ApiProperty({ description: 'Study Program name', example: 'S1 Informatika' })
  studyProgramName: string;

  @ApiProperty({ description: 'Education level', example: 'S.1', nullable: true })
  educationLevel: string | null;

  @ApiProperty({ description: 'Faculty ID', example: 5 })
  facultyId: number;

  @ApiProperty({ description: 'Program director name', example: 'Kery Utami, SE., M.Si.', nullable: true })
  directorName: string | null;

  @ApiProperty({
    description: 'Faculty information',
    type: FacultyResponseDto,
    nullable: true,
  })
  faculty: FacultyResponseDto;

  @ApiProperty({ description: 'Creation date', example: '2023-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2023-01-01T00:00:00Z' })
  updatedAt: Date;

  static fromEntity(studyProgram: StudyProgram, includeFaculty = true): StudyProgramResponseDto {
    const dto = new StudyProgramResponseDto();
    dto.id = studyProgram.id;
    dto.studyProgramCode = studyProgram.studyProgramCode;
    dto.studyProgramName = studyProgram.studyProgramName;
    dto.educationLevel = studyProgram.educationLevel;
    dto.facultyId = studyProgram.facultyId;
    dto.directorName = studyProgram.directorName;
    dto.createdAt = studyProgram.createdAt;
    dto.updatedAt = studyProgram.updatedAt;
    if (includeFaculty) {
      dto.faculty = FacultyResponseDto.fromEntity(studyProgram.faculty);
    }
    return dto;
  }
}

export class PageableStudyProgramResponseDto {
  @ApiProperty({
    type: StudyProgramResponseDto,
    description: 'List of study programs',
    isArray: true,
  })
  items: StudyProgramResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Pagination metadata',
  })
  meta: PaginationMetaDto;
}

import { SearchDto } from '@/shared/types/SearchTypes';

export interface Faculty {
  id: number;
  facultyCode: string;
  facultyName: string;
  facultyAbbreviation: string;
  deanName: string | null;
  viceDean1Name: string | null;
  viceDean2Name: string | null;
  viceDean3Name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyProgram {
  id: number;
  studyProgramCode: string;
  studyProgramName: string;
  educationLevel: string | null;
  facultyId: number;
  directorName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum StudyProgramSortBy {
  studyProgramName = 'studyProgramName',
  studyProgramCode = 'studyProgramCode',
  educationLevel = 'educationLevel',
}

export interface SearchStudyProgramDto extends SearchDto {
  facultyId?: number;
  educationLevel?: string;
  sortBy?: StudyProgramSortBy;
}

import { BaseQueryParams } from '@/shared/types/RequestTypes';

// ===== CORE ENTITIES =====

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

// ===== QUERY PARAMETERS =====

export interface StudyProgramQueryParams extends BaseQueryParams {
  facultyId?: number;
  educationLevel?: string;
  sortBy?: StudyProgramSortBy;
}

// ===== ENUMS =====

export enum StudyProgramSortBy {
  studyProgramName = 'studyProgramName',
  studyProgramCode = 'studyProgramCode',
  educationLevel = 'educationLevel',
}

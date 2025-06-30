import { apiClient } from '@/shared/services/client';
import { SearchDto } from '@/shared/types/RequestTypes';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { Faculty, StudyProgram } from '../types';

export const academicApi = {
  async getFaculties(search: SearchDto): Promise<PaginatedResponse<Faculty>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Faculty>>>('/academic/faculties', {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch faculties');
    }
  },

  async getFacultyById(id: number): Promise<Faculty> {
    try {
      const response = await apiClient.get<ApiResponse<Faculty>>(`/academic/faculties/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch faculty with ID ${id}`);
    }
  },

  async getFacultyByCode(code: string): Promise<Faculty> {
    try {
      const response = await apiClient.get<ApiResponse<Faculty>>(`/academic/faculties/code/${code}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch faculty with code ${code}`);
    }
  },

  async getStudyPrograms(search: SearchDto): Promise<PaginatedResponse<StudyProgram>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<StudyProgram>>>('/academic/study-programs', {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch study programs');
    }
  },

  async getStudyProgramById(id: number): Promise<StudyProgram> {
    try {
      const response = await apiClient.get<ApiResponse<StudyProgram>>(`/academic/study-programs/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch study program with ID ${id}`);
    }
  },

  async getStudyProgramByCode(code: string): Promise<StudyProgram> {
    try {
      const response = await apiClient.get<ApiResponse<StudyProgram>>(`/academic/study-programs/code/${code}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, `Failed to fetch study program with code ${code}`);
    }
  },
};

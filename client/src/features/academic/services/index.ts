import { apiClient } from '@/services/client';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { SearchDto } from '@/types/SearchTypes';
import { handleApiError } from '@/utils/helpers';
import { Faculty, StudyProgram } from '../types';

export const academicApi = {
  async getFaculties(search: SearchDto): Promise<PaginatedResponse<Faculty>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Faculty>>>('/academic/faculties', {
        params: search,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch faculties');
    }
  },

  async getStudyPrograms(search: SearchDto): Promise<PaginatedResponse<StudyProgram>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<StudyProgram>>>('/academic/study-programs', {
        params: search,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch study programs');
    }
  },
};

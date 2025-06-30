import { HandleReportRequest, Report } from '@/features/reports/types';
import { CreateSpaceRequest, Space, UpdateSpaceRequest } from '@/features/spaces/types';
import { CreateUserRequest, UpdateUserRequest, User } from '@/features/users/types';
import { apiClient } from '@/shared/services/client';
import { ApiResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { ActivityData, ActivityDataParams, DashboardStats, StatsParams } from '../types';

export const adminApi = {
  // ===== DASHBOARD OPERATIONS =====

  async getDashboardStats(params: StatsParams): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard', { params });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch dashboard stats');
    }
  },

  async getActivityData(params: ActivityDataParams): Promise<ActivityData> {
    try {
      const response = await apiClient.get<ApiResponse<ActivityData>>('/admin/dashboard/activity', { params });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch activity data');
    }
  },

  // ===== USER OPERATIONS =====

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>('/admin/users', userData);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create user');
    }
  },

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, userData);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update user');
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
    } catch (error) {
      throw handleApiError(error, 'Failed to delete user');
    }
  },

  // ===== SPACE OPERATIONS =====

  async createSpace(data: CreateSpaceRequest): Promise<Space> {
    try {
      const formData = new FormData();

      // Required fields
      formData.append('name', data.name.trim());
      formData.append('slug', data.slug.trim());
      formData.append('spaceType', data.spaceType);

      // Optional fields
      if (data.facultyId) {
        formData.append('facultyId', data.facultyId.toString());
      }
      if (data.studyProgramId) {
        formData.append('studyProgramId', data.studyProgramId.toString());
      }
      if (data.description) {
        formData.append('description', data.description.trim());
      }

      // File uploads
      if (data.icon instanceof File) {
        formData.append('icon', data.icon);
      }
      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }

      const response = await apiClient.post<ApiResponse<Space>>('/admin/spaces', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create space');
    }
  },

  async updateSpace(spaceId: number, data: UpdateSpaceRequest): Promise<Space> {
    try {
      const formData = new FormData();

      // Only append fields that are defined
      if (data.name !== undefined) {
        formData.append('name', data.name.trim());
      }
      if (data.slug !== undefined) {
        formData.append('slug', data.slug.trim());
      }
      if (data.description !== undefined) {
        formData.append('description', data.description.trim());
      }
      if (data.spaceType !== undefined) {
        formData.append('spaceType', data.spaceType);
      }
      if (data.facultyId !== undefined) {
        formData.append('facultyId', data.facultyId?.toString() || '');
      }
      if (data.studyProgramId !== undefined) {
        formData.append('studyProgramId', data.studyProgramId?.toString() || '');
      }

      // File uploads
      if (data.icon instanceof File) {
        formData.append('icon', data.icon);
      }
      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }

      // File removal flags
      if (data.removeIcon) {
        formData.append('removeIcon', 'true');
      }
      if (data.removeBanner) {
        formData.append('removeBanner', 'true');
      }

      const response = await apiClient.patch<ApiResponse<Space>>(`/admin/spaces/${spaceId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update space');
    }
  },

  async deleteSpace(spaceId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/admin/spaces/${spaceId}`);
    } catch (error) {
      throw handleApiError(error, 'Failed to delete space');
    }
  },

  // ===== REPORT OPERATIONS =====

  async handleReport(id: number, data: HandleReportRequest): Promise<Report> {
    try {
      const response = await apiClient.post<ApiResponse<Report>>(`/admin/reports/${id}/handle`, data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update report status');
    }
  },

  // ===== ACADEMIC OPERATIONS =====

  async syncFaculties(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/admin/academic/sync-faculties');
    } catch (error) {
      throw handleApiError(error, 'Failed to sync faculties');
    }
  },

  async syncStudyPrograms(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/admin/academic/sync-study-programs');
    } catch (error) {
      throw handleApiError(error, 'Failed to sync study programs');
    }
  },
};

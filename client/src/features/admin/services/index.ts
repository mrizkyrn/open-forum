import { ReportStatus } from '@/features/reports/types';
import { CreateSpaceDto, Space, UpdateSpaceDto } from '@/features/spaces/types';
import { CreateUserDto, UpdateUserDto, User, UserRole } from '@/features/users/types';
import { apiClient } from '@/shared/services/client';
import { ApiResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { ActivityData, ActivityDataParams, DashboardStats, StatsParams } from '../types';

export const adminApi = {
  async getDashboardStats(params: StatsParams): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard', { params });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch dashboard stats');
    }
  },

  async getActivityData(params: ActivityDataParams): Promise<ActivityData> {
    try {
      const response = await apiClient.get<ApiResponse<ActivityData>>('/admin/dashboard/activity', { params });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to fetch activity data');
    }
  },

  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<User>>('/admin/users', userData);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create user');
    }
  },

  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, userData);
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update user');
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete user');
    }
  },

  async changeUserRole(id: number, role: UserRole): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}/role`, { role });
      return response.data.data;
    } catch (error: any) {
      throw handleApiError(error, 'Failed to change user role');
    }
  },

  async getUserActivity(id: number, days: number = 30): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${id}/activity`, {
        params: { days },
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch user activity');
    }
  },

  async createSpace(data: CreateSpaceDto): Promise<Space> {
    try {
      // Always use FormData for consistency with file uploads
      const formData = new FormData();

      // Append basic space information
      formData.append('name', data.name.trim());
      formData.append('slug', data.slug.trim());
      formData.append('spaceType', data.spaceType);

      if (data.facultyId) {
        formData.append('facultyId', data.facultyId.toString());
      }

      if (data.studyProgramId) {
        formData.append('studyProgramId', data.studyProgramId.toString());
      }

      if (data.description) {
        formData.append('description', data.description.trim());
      }

      // Append files if they exist
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
    } catch (error: any) {
      throw handleApiError(error, 'Failed to create space');
    }
  },

  async updateSpace(spaceId: number, data: UpdateSpaceDto): Promise<Space> {
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

      // Append files if they exist
      if (data.icon instanceof File) {
        formData.append('icon', data.icon);
      }

      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }

      // If icon or banner should be removed, send a special flag
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
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update space');
    }
  },

  async deleteSpace(spaceId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/admin/spaces/${spaceId}`);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to delete space');
    }
  },

  async handleReport(
    id: number,
    data: {
      status: ReportStatus;
      deleteContent: boolean;
      note?: string;
      notifyReporter?: boolean;
      notifyAuthor?: boolean;
    },
  ): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(`/admin/reports/${id}/handle`, data);
    } catch (error: any) {
      throw handleApiError(error, 'Failed to update report status');
    }
  },

  async syncFaculties(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/admin/academic/sync-faculties');
    } catch (error: any) {
      throw handleApiError(error, 'Failed to sync faculties');
    }
  },

  async syncStudyPrograms(): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/admin/academic/sync-study-programs');
    } catch (error: any) {
      throw handleApiError(error, 'Failed to sync study programs');
    }
  },
};

import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import {
  AssignBugReportRequest,
  BugReport,
  BugReportQueryParams,
  CreateBugReportRequest,
  UpdateBugReportRequest,
  UpdateBugReportStatusRequest,
} from '../types';

export const bugReportApi = {
  async createBugReport(data: CreateBugReportRequest): Promise<BugReport> {
    try {
      const response = await apiClient.post<ApiResponse<BugReport>>('/bug-reports', data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to create bug report');
    }
  },

  async getBugReports(params: BugReportQueryParams): Promise<PaginatedResponse<BugReport>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<BugReport>>>('/bug-reports', {
        params,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch bug reports');
    }
  },

  async getBugReportById(id: number): Promise<BugReport> {
    try {
      const response = await apiClient.get<ApiResponse<BugReport>>(`/bug-reports/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch bug report');
    }
  },

  async updateBugReport(id: number, data: UpdateBugReportRequest): Promise<BugReport> {
    try {
      const response = await apiClient.patch<ApiResponse<BugReport>>(`/bug-reports/${id}`, data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update bug report');
    }
  },

  async deleteBugReport(id: number): Promise<void> {
    try {
      await apiClient.delete(`/bug-reports/${id}`);
    } catch (error) {
      throw handleApiError(error, 'Failed to delete bug report');
    }
  },

  async assignBugReport(id: number, data: AssignBugReportRequest): Promise<BugReport> {
    try {
      // Convert null to 0 for unassigning as expected by backend
      const userId = data.assignedToId || 0;
      const response = await apiClient.patch<ApiResponse<BugReport>>(`/bug-reports/${id}/assign/${userId}`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to assign bug report');
    }
  },

  async updateBugReportStatus(id: number, data: UpdateBugReportStatusRequest): Promise<BugReport> {
    try {
      const response = await apiClient.patch<ApiResponse<BugReport>>(`/bug-reports/${id}/status`, data);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to update bug report status');
    }
  },
};

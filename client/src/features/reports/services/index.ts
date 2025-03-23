import { apiClient } from '@/services/client';
import { ApiResponse, PaginatedResponse } from '@/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { Report, ReportReason, SearchReportDto } from '../types';

export const reportApi = {
  async createReport(report: any): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>('/reports', report);
    } catch (error: any) {
      return handleApiError(error, 'Failed to submit report');
    }
  },

  async getReports(search: SearchReportDto): Promise<PaginatedResponse<Report>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Report>>>('/reports', {
        params: search,
      });
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch reports');
    }
  },

  async getReportStats(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/reports/stats');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch report statistics');
    }
  },

  async getReportReasons(): Promise<ReportReason[]> {
    try {
      const response = await apiClient.get<ApiResponse<ReportReason[]>>('/reports/reasons');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch report reasons');
    }
  },
};

import { apiClient } from '@/shared/services/client';
import { ApiResponse, PaginatedResponse } from '@/shared/types/ResponseTypes';
import { handleApiError } from '@/utils/helpers';
import { CreateReportRequest, Report, ReportQueryParams, ReportReason, ReportStatsResponse } from '../types';

export const reportApi = {
  async createReport(report: CreateReportRequest): Promise<Report> {
    try {
      const response = await apiClient.post<ApiResponse<Report>>('/reports', report);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to submit report');
    }
  },

  async getReports(search: ReportQueryParams): Promise<PaginatedResponse<Report>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Report>>>('/reports', {
        params: search,
      });
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch reports');
    }
  },

  async getReportById(id: number): Promise<Report> {
    try {
      const response = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch report details');
    }
  },

  async getReportReasons(): Promise<ReportReason[]> {
    try {
      const response = await apiClient.get<ApiResponse<ReportReason[]>>('/reports/reasons');
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch report reasons');
    }
  },

  async getReportStatsResponse(): Promise<ReportStatsResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ReportStatsResponse>>('/reports/stats');
      return response.data.data;
    } catch (error) {
      return handleApiError(error, 'Failed to fetch report statistics');
    }
  },
};

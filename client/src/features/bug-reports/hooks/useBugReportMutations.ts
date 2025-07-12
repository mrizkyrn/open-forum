import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { bugReportApi } from '../services';
import {
  AssignBugReportRequest,
  CreateBugReportRequest,
  UpdateBugReportRequest,
  UpdateBugReportStatusRequest,
} from '../types';

export const useCreateBugReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBugReportRequest) => bugReportApi.createBugReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast.success('Bug report created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create bug report');
    },
  });
};

export const useUpdateBugReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBugReportRequest }) => bugReportApi.updateBugReport(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-report', id] });
      toast.success('Bug report updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update bug report');
    },
  });
};

export const useDeleteBugReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => bugReportApi.deleteBugReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      toast.success('Bug report deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete bug report');
    },
  });
};

export const useAssignBugReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignBugReportRequest }) => bugReportApi.assignBugReport(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-report', id] });
      toast.success('Bug report assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign bug report');
    },
  });
};

export const useUpdateBugReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBugReportStatusRequest }) =>
      bugReportApi.updateBugReportStatus(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-report', id] });
      toast.success('Bug report status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update bug report status');
    },
  });
};

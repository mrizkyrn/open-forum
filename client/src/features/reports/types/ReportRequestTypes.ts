import { ReportTargetType } from './ReportTypes';

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: number;
  reasonId: number;
  description?: string;
}

import { useState } from 'react';
import { ReportTargetType } from '@/features/reports/types';
import ReportModal from '@/features/reports/components/ReportModal';

export function useReport() {
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    targetType?: ReportTargetType;
    targetId?: number;
    contentPreview?: string;
  }>({
    isOpen: false,
  });

  const openReportModal = (targetType: ReportTargetType, targetId: number, contentPreview?: string) => {
    setReportModalState({
      isOpen: true,
      targetType,
      targetId,
      contentPreview,
    });
  };

  const closeReportModal = () => {
    setReportModalState({
      isOpen: false,
    });
  };

  // Render prop pattern to easily include the modal in components
  const ReportModalComponent = () => (
    <ReportModal
      isOpen={reportModalState.isOpen}
      onClose={closeReportModal}
      targetType={reportModalState.targetType!}
      targetId={reportModalState.targetId!}
      contentPreview={reportModalState.contentPreview}
    />
  );

  return {
    openReportModal,
    closeReportModal,
    ReportModal: ReportModalComponent,
  };
}

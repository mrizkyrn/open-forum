import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flag,
  X,
  User,
  Calendar,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { adminApi } from '@/features/admin/services/adminApi';
import { Report, ReportStatus } from '@/features/reports/types';
import Modal from '@/components/modals/Modal';
import { toast } from 'react-toastify';
import AvatarImage from '@/features/users/components/AvatarImage';
import StatusBadge from './StatusBadge';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report }) => {
  const queryClient = useQueryClient();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ReportStatus | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const { mutate: updateReportStatus, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReportStatus }) => adminApi.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['reportStats'] });
      toast.success('Report status updated successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update report status');
    },
  });

  const handleActionClick = (status: ReportStatus) => {
    setPendingAction(status);

    // Set confirmation message based on the action
    if (status === ReportStatus.RESOLVED) {
      setConfirmMessage(
        'Are you sure you want to mark this report as resolved? This indicates that you have reviewed the content and taken appropriate action.',
      );
    } else if (status === ReportStatus.DISMISSED) {
      setConfirmMessage(
        'Are you sure you want to dismiss this report? This indicates that you have reviewed the content and found no policy violation.',
      );
    } else {
      setConfirmMessage('Are you sure you want to reopen this report?');
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (report && pendingAction) {
      updateReportStatus({ id: report.id, status: pendingAction });
      setIsConfirmModalOpen(false);
    }
  };

  const getTargetTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!report) return null;

  const isContentDeleted = report.targetDetails.deleted;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <Flag size={18} className="mr-2 text-red-500" />
              Report Details #{report.id}
            </h3>
            <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column - Report details */}
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium tracking-wider text-gray-500 uppercase">Report Information</h4>
                <div className="mt-2 space-y-3">
                  <div className="flex items-start">
                    <Flag className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason</p>
                      <p className="text-sm text-gray-900">{report.reason.name}</p>
                      {report.reason.description && (
                        <p className="mt-1 text-xs text-gray-500">{report.reason.description}</p>
                      )}
                    </div>
                  </div>

                  {report.description && (
                    <div className="flex items-start">
                      <MessageSquare className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Description</p>
                        <p className="text-sm text-gray-900">{report.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <User className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reporter</p>
                      <div className="mt-1 flex items-center">
                        <AvatarImage
                          avatarUrl={report.reporter.avatarUrl}
                          fullName={report.reporter.fullName}
                          size="sm"
                        />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{report.reporter.fullName}</p>
                          <p className="text-xs text-gray-500">@{report.reporter.username}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Calendar className="mt-1 mr-2 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reported on</p>
                      <p className="text-sm text-gray-900">{format(new Date(report.createdAt), 'PPPp')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="mb-4">
                <h4 className="text-sm font-medium tracking-wider text-gray-500 uppercase">Status</h4>
                <div className="mt-2">
                  {report.status === ReportStatus.PENDING && (
                    <StatusBadge label="Pending Review" icon={<Loader2 size={14} />} color="yellow" />
                  )}
                  {report.status === ReportStatus.RESOLVED && (
                    <StatusBadge label="Resolved" icon={<CheckCircle size={14} />} color="green" />
                    // <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    //   <CheckCircle size={14} className="mr-1" />
                    //   Resolved
                    // </div>
                  )}
                  {report.status === ReportStatus.DISMISSED && (
                    <StatusBadge label="Dismissed" icon={<X size={14} />} color="gray" />
                    // <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                    //   <X size={14} className="mr-1" />
                    //   Dismissed
                    // </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-sm font-medium tracking-wider text-gray-500 uppercase">Actions</h4>
                <div className="mt-2 flex flex-wrap gap-3">
                  {report.status === ReportStatus.PENDING && (
                    <>
                      <button
                        onClick={() => handleActionClick(ReportStatus.RESOLVED)}
                        className="inline-flex items-center rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                        disabled={isUpdating}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Mark as Resolved
                      </button>
                      <button
                        onClick={() => handleActionClick(ReportStatus.DISMISSED)}
                        className="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        disabled={isUpdating}
                      >
                        <X size={16} className="mr-2" />
                        Dismiss Report
                      </button>
                    </>
                  )}
                  {report.status !== ReportStatus.PENDING && (
                    <button
                      onClick={() => handleActionClick(ReportStatus.PENDING)}
                      className="inline-flex items-center rounded-md bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
                      disabled={isUpdating}
                    >
                      <AlertTriangle size={16} className="mr-2" />
                      Reopen Report
                    </button>
                  )}
                </div>
              </div>

              {/* Resolution details */}
              {report.status !== ReportStatus.PENDING && report.reviewer && (
                <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center">
                    <AvatarImage avatarUrl={report.reviewer.avatarUrl} fullName={report.reviewer.fullName} size="sm" />
                    <div className="ml-2">
                      <p className="text-sm">
                        <span className="font-medium">{report.reviewer.fullName}</span>{' '}
                        <span className="text-gray-500">
                          {report.status === ReportStatus.RESOLVED ? 'resolved' : 'dismissed'} this report
                        </span>
                      </p>
                      {report.reviewedAt && (
                        <p className="text-xs text-gray-500">{format(new Date(report.reviewedAt), 'PPp')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Reported content */}
            <div>
              <h4 className="text-sm font-medium tracking-wider text-gray-500 uppercase">
                Reported {getTargetTypeLabel(report.targetType)}
              </h4>
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                {isContentDeleted ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <AlertTriangle size={32} className="mb-2 text-yellow-500" />
                    <p className="font-medium">Content has been deleted</p>
                    <p className="mt-1 text-sm text-gray-500">The reported content is no longer available</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <AvatarImage
                          avatarUrl={report.targetDetails.author?.avatarUrl}
                          fullName={report.targetDetails.author?.fullName || ''}
                          size="sm"
                        />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{report.targetDetails.author?.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {report.targetDetails.createdAt && format(new Date(report.targetDetails.createdAt), 'PPp')}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {getTargetTypeLabel(report.targetType)}
                      </span>
                    </div>

                    <div className="mt-2 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white p-3 text-sm">
                      {report.targetDetails.content}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <a
                        href={`/discussions/${
                          report.targetType === 'discussion'
                            ? report.targetId
                            : `${report.targetId || ''}?commentId=${report.targetId}`
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        View in Context
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${pendingAction?.charAt(0).toUpperCase() + pendingAction?.slice(1)}`}
        message={confirmMessage}
        confirmButtonText={
          pendingAction === ReportStatus.PENDING
            ? 'Reopen'
            : pendingAction === ReportStatus.RESOLVED
            ? 'Resolve'
            : 'Dismiss'
        }
        // confirmButtonColor={
        //   pendingAction === ReportStatus.PENDING ? 'yellow' : pendingAction === ReportStatus.RESOLVED ? 'green' : 'gray'
        // }
        isDeleting={isUpdating}
      />
        
      {/* <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        title={`Confirm ${pendingAction?.charAt(0).toUpperCase() + pendingAction?.slice(1)}`}
        message={confirmMessage}
        confirmText={
          pendingAction === ReportStatus.PENDING
            ? 'Reopen'
            : pendingAction === ReportStatus.RESOLVED
              ? 'Resolve'
              : 'Dismiss'
        }
        confirmButtonColor={
          pendingAction === ReportStatus.PENDING ? 'yellow' : pendingAction === ReportStatus.RESOLVED ? 'green' : 'gray'
        }
        isLoading={isUpdating}
      /> */}
    </>
  );
};

export default ReportDetailModal;

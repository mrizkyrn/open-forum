import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { ModalBody, ModalFooter, ModalHeader } from '@/components/modals/Modal';
import Modal from '@/components/modals/Modal/Modal';
import MainButton from '@/components/ui/buttons/MainButton';
import { adminApi } from '@/features/admin/services';
import { Report, ReportStatus, ReportTargetType } from '@/features/reports/types';
import UserAvatar from '@/features/users/components/UserAvatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, ExternalLink, Trash2, XCircle } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { toast } from 'react-toastify';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report }) => {
  const queryClient = useQueryClient();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionDetails, setActionDetails] = useState({
    status: ReportStatus.RESOLVED,
    deleteContent: false,
    note: '',
    notifyReporter: true,
    notifyAuthor: true,
  });

  // Handle report mutation (including content deletion and status updates)
  const { mutate: handleReport, isPending } = useMutation({
    mutationFn: (data: {
      id: number;
      status: ReportStatus;
      deleteContent: boolean;
      note?: string;
      notifyReporter?: boolean;
      notifyAuthor?: boolean;
    }) => {
      return adminApi.handleReport(data.id, {
        status: data.status,
        deleteContent: data.deleteContent,
        note: data.note,
        notifyReporter: data.notifyReporter,
        notifyAuthor: data.notifyAuthor,
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      queryClient.invalidateQueries({ queryKey: ['reportStats'] });

      const actionType = actionDetails.deleteContent
        ? 'deleted'
        : actionDetails.status === ReportStatus.RESOLVED
          ? 'resolved'
          : actionDetails.status === ReportStatus.DISMISSED
            ? 'dismissed'
            : 'updated';

      toast.success(`Report ${actionType} successfully`);
      onClose();
      setIsConfirmModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to handle report');
      setIsConfirmModalOpen(false);
    },
  });

  if (!report) return null;

  const isContentDeleted = report.targetDetails?.deleted || false;

  // Format date strings for display
  const formatDate = (date: string | Date) => {
    return date ? format(new Date(date), 'PPP p') : 'N/A';
  };

  // Get variant for confirmation modal based on action
  const getConfirmationVariant = () => {
    if (actionDetails.deleteContent) return 'danger';
    if (actionDetails.status === ReportStatus.RESOLVED) return 'success';
    if (actionDetails.status === ReportStatus.DISMISSED) return 'info';
    return 'warning'; // For reopening reports
  };

  // Get confirmation title based on action
  const getConfirmationTitle = () => {
    if (actionDetails.deleteContent) return 'Delete Reported Content';
    if (actionDetails.status === ReportStatus.RESOLVED) return 'Resolve Report';
    if (actionDetails.status === ReportStatus.DISMISSED) return 'Dismiss Report';
    return 'Reopen Report';
  };

  // Get button text based on action
  const getConfirmButtonText = () => {
    if (actionDetails.deleteContent) return 'Delete Content';
    if (actionDetails.status === ReportStatus.RESOLVED) return 'Resolve';
    if (actionDetails.status === ReportStatus.DISMISSED) return 'Dismiss';
    return 'Reopen';
  };

  // Get confirmation message (including optional form elements)
  const getConfirmationMessage = (): ReactNode => {
    const baseMessage = actionDetails.deleteContent
      ? 'Are you sure you want to delete this content? This action cannot be undone.'
      : actionDetails.status === ReportStatus.RESOLVED
        ? 'This will mark the report as resolved.'
        : actionDetails.status === ReportStatus.DISMISSED
          ? 'This will dismiss the report as not violating policies.'
          : 'This will reopen the report for further review.';

    // For simple actions without forms, just return the message
    if (!actionDetails.deleteContent) {
      return <p>{baseMessage}</p>;
    }

    // For delete action, include the form elements
    return (
      <div>
        <p className="mb-4">{baseMessage}</p>

        <div className="mb-4">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note (optional)
          </label>
          <textarea
            id="note"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
            placeholder="Explain why the content is being removed..."
            value={actionDetails.note}
            onChange={(e) => setActionDetails({ ...actionDetails, note: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500">
            This note will be included in the notification sent to the content author (if enabled)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="notifyReporter"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={actionDetails.notifyReporter}
              onChange={(e) => setActionDetails({ ...actionDetails, notifyReporter: e.target.checked })}
            />
            <label htmlFor="notifyReporter" className="ml-2 block text-sm text-gray-700">
              Notify reporter about this action
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="notifyAuthor"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={actionDetails.notifyAuthor}
              onChange={(e) => setActionDetails({ ...actionDetails, notifyAuthor: e.target.checked })}
            />
            <label htmlFor="notifyAuthor" className="ml-2 block text-sm text-gray-700">
              Notify content author about this action
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (!report) return;
    handleReport({
      id: report.id,
      status: actionDetails.status,
      deleteContent: actionDetails.deleteContent,
      note: actionDetails.note,
      notifyReporter: actionDetails.notifyReporter,
      notifyAuthor: actionDetails.notifyAuthor,
    });
  };

  // Prepare action buttons based on current status
  const renderActionButtons = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {/* Delete content button - only shown if content exists */}
        {!isContentDeleted && (
          <MainButton
            onClick={() => {
              setActionDetails({
                status: ReportStatus.RESOLVED,
                deleteContent: true,
                note: '',
                notifyReporter: true,
                notifyAuthor: true,
              });
              setIsConfirmModalOpen(true);
            }}
            disabled={isPending}
            leftIcon={<Trash2 />}
            variant="danger"
          >
            Delete Content
          </MainButton>
        )}

        {/* Status change buttons - different options based on current status */}
        {report.status === ReportStatus.PENDING && (
          <>
            <MainButton
              onClick={() => {
                setActionDetails({
                  status: ReportStatus.RESOLVED,
                  deleteContent: false,
                  note: '',
                  notifyReporter: true,
                  notifyAuthor: false,
                });
                setIsConfirmModalOpen(true);
              }}
              disabled={isPending}
              leftIcon={<CheckCircle />}
              variant="success"
            >
              Mark as Resolved
            </MainButton>
            <MainButton
              onClick={() => {
                setActionDetails({
                  status: ReportStatus.DISMISSED,
                  deleteContent: false,
                  note: '',
                  notifyReporter: true,
                  notifyAuthor: false,
                });
                setIsConfirmModalOpen(true);
              }}
              disabled={isPending}
              leftIcon={<XCircle />}
              variant="outline"
            >
              Dismiss Report
            </MainButton>
          </>
        )}

        {report.status !== ReportStatus.PENDING && (
          <MainButton
            onClick={() => {
              setActionDetails({
                status: ReportStatus.PENDING,
                deleteContent: false,
                note: '',
                notifyReporter: false,
                notifyAuthor: false,
              });
              setIsConfirmModalOpen(true);
            }}
            disabled={isPending}
            leftIcon={<AlertTriangle />}
            variant="outline"
          >
            Reopen Report
          </MainButton>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Main Report Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalHeader title={`Report #${report.id}`} onClose={onClose} />

        <ModalBody>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left column: Report details */}
            <div className="max-h-[75vh] overflow-y-auto pr-2">
              {/* Report reason and description */}
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-gray-700">Reason</h4>
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="font-medium text-gray-800">{report.reason?.name}</p>
                  {report.reason?.description && (
                    <p className="mt-1 text-sm text-gray-600">{report.reason.description}</p>
                  )}
                </div>
              </div>

              {report.description && (
                <div className="mb-4">
                  <h4 className="mb-2 font-medium text-gray-700">Reporter's Description</h4>
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-gray-800">{report.description}</p>
                  </div>
                </div>
              )}

              {/* Reporter information */}
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-gray-700">Reported by</h4>
                <div className="flex items-center rounded-md bg-gray-50 p-3">
                  <UserAvatar
                    avatarUrl={report.reporter?.avatarUrl}
                    fullName={report.reporter?.fullName || ''}
                    size="md"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-800">{report.reporter?.fullName}</p>
                    <p className="text-sm text-gray-600">@{report.reporter?.username}</p>
                  </div>
                </div>
              </div>

              {/* Time information */}
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-gray-700">Timestamps</h4>
                <div className="space-y-2 rounded-md bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reported on:</span>
                    <span className="text-sm font-medium">{formatDate(report.createdAt)}</span>
                  </div>
                  {report.reviewedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reviewed on:</span>
                      <span className="text-sm font-medium">{formatDate(report.reviewedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status information */}
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-gray-700">Status</h4>
                <div className="rounded-md bg-gray-50 p-3">
                  {report.status === ReportStatus.PENDING && (
                    <div className="flex items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100">
                        <AlertTriangle size={14} className="text-yellow-600" />
                      </div>
                      <span className="ml-2 font-medium text-yellow-600">Pending Review</span>
                    </div>
                  )}
                  {report.status === ReportStatus.RESOLVED && (
                    <div className="flex items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle size={14} className="text-green-600" />
                      </div>
                      <span className="ml-2 font-medium text-green-600">Resolved</span>
                    </div>
                  )}
                  {report.status === ReportStatus.DISMISSED && (
                    <div className="flex items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                        <XCircle size={14} className="text-gray-600" />
                      </div>
                      <span className="ml-2 font-medium text-gray-600">Dismissed</span>
                    </div>
                  )}

                  {/* Reviewer info if report has been handled */}
                  {report.reviewer && report.status !== ReportStatus.PENDING && (
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <div className="flex items-center">
                        <UserAvatar
                          avatarUrl={report.reviewer?.avatarUrl}
                          fullName={report.reviewer?.fullName || ''}
                          size="sm"
                        />
                        <div className="ml-2">
                          <p className="text-sm font-medium">{report.reviewer?.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {report.status === ReportStatus.RESOLVED ? 'Resolved this report' : 'Dismissed this report'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Reported content */}
            <div>
              <h4 className="mb-2 font-medium text-gray-700">
                Reported {report.targetType === ReportTargetType.DISCUSSION ? 'Discussion' : 'Comment'}
              </h4>
              <div className="rounded-lg border border-gray-200 p-4">
                {isContentDeleted ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <AlertTriangle size={40} className="mb-3 text-yellow-500" />
                    <p className="text-lg font-medium text-gray-700">Content has been deleted</p>
                    <p className="mt-1 text-gray-500">The reported content is no longer available</p>
                  </div>
                ) : (
                  <>
                    {/* Content author info */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <UserAvatar
                          avatarUrl={report.targetDetails?.author?.avatarUrl}
                          fullName={report.targetDetails?.author?.fullName || ''}
                          size="md"
                        />
                        <div className="ml-3">
                          <p className="font-medium">{report.targetDetails?.author?.fullName}</p>
                          <p className="text-sm text-gray-600">{formatDate(report.targetDetails?.createdAt || '')}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {report.targetType === ReportTargetType.DISCUSSION ? 'Discussion' : 'Comment'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white p-4">
                      <p className="whitespace-pre-wrap text-gray-800">{report.targetDetails?.content}</p>
                    </div>

                    {/* View in context button */}
                    <div className="mt-3 flex justify-end">
                      <a
                        href={
                          report.targetType === ReportTargetType.DISCUSSION
                            ? `/discussions/${report.targetId}`
                            : `/discussions/${report.targetDetails.discussionId}?comment=${report.targetId}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        <ExternalLink size={16} className="mr-2" />
                        View in Context
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>{renderActionButtons()}</ModalFooter>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title={getConfirmationTitle()}
        message={getConfirmationMessage()}
        confirmButtonText={getConfirmButtonText()}
        cancelButtonText="Cancel"
        variant={getConfirmationVariant()}
        isProcessing={isPending}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        showIcon={true}
        size="md"
      />
    </>
  );
};

export default ReportDetailModal;

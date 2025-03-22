import Modal from '@/components/modals/Modal/Modal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Flag, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { reportApi } from '../services/reportApi';
import { ReportReason, ReportTargetType } from '../types/ReportTypes';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
  contentPreview?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, targetType, targetId, contentPreview }) => {
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    data: reasons = [],
    isLoading: isLoadingReasons,
    error: reasonsError,
    refetch: refetchReasons,
  } = useQuery({
    queryKey: ['reportReasons'],
    queryFn: reportApi.getReportReasons,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const {
    mutate: submitReport,
    isPending: isSubmitting,
    error: submitError,
  } = useMutation({
    mutationFn: (data: { targetType: ReportTargetType; targetId: number; reasonId: number; description?: string }) =>
      reportApi.createReport(data),
    onSuccess: () => {
      toast.success('Report submitted successfully.');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to submit report. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedReason) {
      setValidationError('Please select a reason for reporting.');
      return;
    }

    submitReport({
      targetType,
      targetId,
      reasonId: selectedReason,
      description: description.trim() || undefined,
    });
  };

  const getTargetName = () => {
    switch (targetType) {
      case ReportTargetType.DISCUSSION:
        return 'discussion';
      case ReportTargetType.COMMENT:
        return 'comment';
      default:
        return 'content';
    }
  };

  // Combine all possible error messages
  const errorMessage = validationError || (submitError as Error)?.message || (reasonsError as Error)?.message;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-medium text-gray-900">
            <Flag size={18} className="mr-2 text-red-500" />
            Report {getTargetName()}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {contentPreview && (
          <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Content being reported:</p>
            <p className="mt-1 line-clamp-3 text-sm text-gray-600">{contentPreview}</p>
          </div>
        )}

        {errorMessage && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Reason for reporting</label>
            {isLoadingReasons ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={24} className="animate-spin text-gray-500" />
              </div>
            ) : reasonsError ? (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                Failed to load report reasons.
                <button
                  onClick={() => refetchReasons()}
                  type="button"
                  className="ml-2 font-medium text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : reasons.length === 0 ? (
              <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
                No report reasons available. Please try again later.
              </div>
            ) : (
              <div className="flex flex-col max-h-[50vh] gap-2 overflow-y-auto py-3">
                {reasons.map((reason: ReportReason) => (
                  <label
                    key={reason.id}
                    className={`flex cursor-pointer items-start rounded-md border p-3 transition ${
                      selectedReason === reason.id
                        ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => setSelectedReason(reason.id)}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3">
                      <span className="block font-medium text-gray-800">{reason.name}</span>
                      {reason.description && <p className="mt-1 text-sm text-gray-600">{reason.description}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
              Additional details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional information that will help our moderators review this report."
              className="w-full min-h-[100px] rounded-md border border-gray-300 p-3 text-sm focus:border-green-500 focus:ring-green-500"
              maxLength={1000}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-right text-xs text-gray-500">{description.length}/1000</p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-300"
              disabled={isSubmitting || isLoadingReasons || reasons.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReportModal;

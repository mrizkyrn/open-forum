import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useUpdateBugReport } from '@/features/bug-reports/hooks/useBugReportMutations';
import { BugPriority, BugReport, BugStatus, UpdateBugReportRequest } from '@/features/bug-reports/types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';

interface UpdateBugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bugReport: BugReport;
}

const UpdateBugReportModal = ({ isOpen, onClose, bugReport }: UpdateBugReportModalProps) => {
  const [formData, setFormData] = useState<UpdateBugReportRequest>({
    title: '',
    description: '',
    priority: BugPriority.MEDIUM,
  });

  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  const { mutate: updateBugReport, isPending } = useUpdateBugReport();

  // Check if user can update this bug report based on status
  const canUpdateBugReport = () => {
    // Check status restrictions - users can only update open and in-progress reports
    const allowedStatuses = [BugStatus.OPEN, BugStatus.IN_PROGRESS];
    return allowedStatuses.includes(bugReport.status);
  };

  const getStatusRestrictionMessage = () => {
    if (bugReport.status === BugStatus.RESOLVED) {
      return 'This bug report has been resolved and cannot be updated.';
    }

    if (bugReport.status === BugStatus.CLOSED) {
      return 'This bug report has been closed and cannot be updated.';
    }

    return null;
  };

  // Initialize form data when modal opens or bug report changes
  useEffect(() => {
    if (isOpen && bugReport) {
      setFormData({
        title: bugReport.title,
        description: bugReport.description,
        priority: bugReport.priority,
      });
      setErrors({});
    }
  }, [isOpen, bugReport]);

  const updateFormField = <K extends keyof UpdateBugReportRequest>(field: K, value: UpdateBugReportRequest[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
      isValid = false;
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    updateBugReport(
      {
        id: bugReport.id,
        data: formData,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const statusMessage = getStatusRestrictionMessage();
  const canUpdate = canUpdateBugReport();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalHeader title="Update Bug Report" onClose={handleClose} />

      <ModalBody>
        {/* Status restriction warning */}
        {statusMessage && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">{statusMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
            Bug Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title || ''}
            onChange={(e) => updateFormField('title', e.target.value)}
            placeholder="Briefly describe the bug"
            disabled={!canUpdate}
            className={`w-full rounded-md border ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
              !canUpdate ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateFormField('description', e.target.value)}
            placeholder="Provide a detailed description of the bug, including steps to reproduce and environment details"
            disabled={!canUpdate}
            className={`w-full rounded-md border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
              !canUpdate ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            rows={8}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Priority */}
        <div className="mb-4">
          <label htmlFor="priority" className="mb-2 block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority || BugPriority.MEDIUM}
            onChange={(e) => updateFormField('priority', e.target.value as BugPriority)}
            disabled={!canUpdate}
            className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
              !canUpdate ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value={BugPriority.LOW}>Low</option>
            <option value={BugPriority.MEDIUM}>Medium</option>
            <option value={BugPriority.HIGH}>High</option>
            <option value={BugPriority.CRITICAL}>Critical</option>
          </select>
        </div>
      </ModalBody>

      <ModalFooter>
        <MainButton onClick={handleClose} disabled={isPending} variant="outline">
          Cancel
        </MainButton>
        <MainButton
          onClick={handleSubmit}
          disabled={isPending || !canUpdate || !formData.title?.trim() || !formData.description?.trim()}
          isLoading={isPending}
          leftIcon={<CheckCircle size={18} />}
        >
          Update Bug Report
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default UpdateBugReportModal;

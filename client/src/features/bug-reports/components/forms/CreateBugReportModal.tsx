import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { useCreateBugReport } from '@/features/bug-reports/hooks/useBugReportMutations';
import { BugPriority, CreateBugReportRequest } from '@/features/bug-reports/types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';

interface CreateBugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBugReportModal = ({ isOpen, onClose }: CreateBugReportModalProps) => {
  const [formData, setFormData] = useState<CreateBugReportRequest>({
    title: '',
    description: '',
    priority: BugPriority.MEDIUM,
  });

  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  const { mutate: createBugReport, isPending } = useCreateBugReport();

  const updateFormField = <K extends keyof CreateBugReportRequest>(field: K, value: CreateBugReportRequest[K]) => {
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

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
      isValid = false;
    }

    if (!formData.description.trim()) {
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

    createBugReport(formData, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: BugPriority.MEDIUM,
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalHeader title="Report a Bug" onClose={handleClose} />

      <ModalBody>
        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
            Bug Title *
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => updateFormField('title', e.target.value)}
            placeholder="Briefly describe the bug"
            className={`w-full rounded-md border ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
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
            value={formData.description}
            onChange={(e) => updateFormField('description', e.target.value)}
            placeholder="Provide a detailed description of the bug, including steps to reproduce and environment details"
            className={`w-full rounded-md border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
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
            value={formData.priority}
            onChange={(e) => updateFormField('priority', e.target.value as BugPriority)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          disabled={isPending || !formData.title.trim() || !formData.description.trim()}
          isLoading={isPending}
          leftIcon={<CheckCircle size={18} />}
        >
          Report Bug
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default CreateBugReportModal;

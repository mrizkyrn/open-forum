import { Loader2 } from 'lucide-react';
import Modal from './Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div>
        <h3 className="mb-4 text-lg font-medium">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isDeleting}
          >
            {cancelButtonText}
          </button>

          <button
            onClick={onConfirm}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="mr-2 inline animate-spin" />
                Deleting...
              </>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;

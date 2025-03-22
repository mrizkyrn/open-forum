import MainButton from '@/components/ui/buttons/MainButton';
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle, Info } from 'lucide-react';
import { ReactNode } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './Modal';

export type ConfirmationVariant = 'danger' | 'warning' | 'success' | 'info' | 'question';

export interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  variant?: ConfirmationVariant;
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  variant = 'question',
  isProcessing = false,
  onCancel,
  onConfirm,
  showIcon = true,
  size = 'sm',
}) => {
  // Define variant configurations
  const variantConfig = {
    danger: {
      icon: <AlertCircle size={22} />,
      iconClass: 'text-red-500',
      buttonVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle size={22} />,
      iconClass: 'text-amber-500',
      buttonVariant: 'warning' as const,
    },
    success: {
      icon: <CheckCircle size={22} />,
      iconClass: 'text-green-500',
      buttonVariant: 'primary' as const,
    },
    info: {
      icon: <Info size={22} />,
      iconClass: 'text-blue-500',
      buttonVariant: 'primary' as const,
    },
    question: {
      icon: <HelpCircle size={22} />,
      iconClass: 'text-gray-500',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size={size}>
      <ModalHeader title={title} onClose={onCancel} />

      <ModalBody>
        <div className="flex items-start gap-3">
          {showIcon && <div className={`flex-shrink-0 ${config.iconClass}`}>{config.icon}</div>}
          <div className={`${!showIcon ? 'w-full' : ''}`}>
            {typeof message === 'string' ? <p className="text-gray-600">{message}</p> : message}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <MainButton onClick={onCancel} disabled={isProcessing} variant="outline">
          {cancelButtonText}
        </MainButton>

        <MainButton onClick={onConfirm} disabled={isProcessing} isLoading={isProcessing} variant={config.buttonVariant}>
          {confirmButtonText}
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default ConfirmationModal;

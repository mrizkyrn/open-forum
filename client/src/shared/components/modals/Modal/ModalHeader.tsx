import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  rightContent?: ReactNode;
  className?: string;
}

const ModalHeader = ({ title, onClose, showCloseButton = true, rightContent, className = '' }: ModalHeaderProps) => {
  return (
    <div className={`flex-shrink-0 border-b border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark">{title}</h2>
        <div className="flex items-center gap-2">
          {rightContent}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalHeader;

import { useEffect, useRef, ReactNode, MouseEvent } from 'react';
import { createPortal } from 'react-dom';

let openModalCount = 0;

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  preventClose?: boolean;
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOutsideClick = true,
  closeOnEsc = true,
  preventClose = false,
  className = '',
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const previousBodyStylesRef = useRef({
    overflow: '',
    position: '',
    top: '',
    width: '',
    paddingRight: '',
  });

  // Size map for max-width classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-[90vw]',
  };

  // Handle click outside
  const handleOutsideClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (closeOnOutsideClick && !preventClose && modalRef.current && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      scrollPositionRef.current = window.pageYOffset;

      // Store original body styles
      previousBodyStylesRef.current = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        paddingRight: document.body.style.paddingRight,
      };

      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Apply styles to lock scrolling - works on desktop and iOS
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';

      // Add padding to compensate for scrollbar removal (prevents layout shift)
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Increment open modal counter
      openModalCount++;
    } else if (openModalCount > 0) {
      // Only restore if we were previously open
      openModalCount--;

      // Only restore body styles when all modals are closed
      if (openModalCount === 0) {
        // Restore body styles
        document.body.style.overflow = previousBodyStylesRef.current.overflow;
        document.body.style.position = previousBodyStylesRef.current.position;
        document.body.style.top = previousBodyStylesRef.current.top;
        document.body.style.width = previousBodyStylesRef.current.width;
        document.body.style.paddingRight = previousBodyStylesRef.current.paddingRight;

        // Restore scroll position
        window.scrollTo(0, scrollPositionRef.current);
      }
    }

    return () => {
      // Clean up when component unmounts
      if (isOpen && openModalCount > 0) {
        openModalCount--;

        // Only restore body styles when all modals are closed
        if (openModalCount === 0) {
          // Restore body styles
          document.body.style.overflow = previousBodyStylesRef.current.overflow;
          document.body.style.position = previousBodyStylesRef.current.position;
          document.body.style.top = previousBodyStylesRef.current.top;
          document.body.style.width = previousBodyStylesRef.current.width;
          document.body.style.paddingRight = previousBodyStylesRef.current.paddingRight;

          // Restore scroll position
          window.scrollTo(0, scrollPositionRef.current);
        }
      }
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (closeOnEsc && !preventClose && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, closeOnEsc, preventClose]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleOutsideClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`w-full ${sizeClasses[size]} rounded-lg bg-white ${className}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default Modal;

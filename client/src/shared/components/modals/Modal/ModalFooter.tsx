import { ReactNode } from 'react';

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end' | 'between';
}

const ModalFooter = ({ children, className = '', align = 'end' }: ModalFooterProps) => {
  const alignmentClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={`flex-shrink-0 border-t border-gray-200 p-4 ${className}`}>
      <div className={`flex items-center gap-2 ${alignmentClasses[align]}`}>{children}</div>
    </div>
  );
};

export default ModalFooter;

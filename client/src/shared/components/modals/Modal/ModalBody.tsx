import { ReactNode } from 'react';

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

const ModalBody = ({ children, className = '' }: ModalBodyProps) => {
  return <div className={`flex-grow overflow-y-auto px-5 py-4 max-h-[65vh] ${className}`}>{children}</div>;
};

export default ModalBody;

import { useDropdown } from '@/hooks/useDropdown';
import React, { KeyboardEvent, useEffect, useRef } from 'react';

export interface DropdownProps {
  children: React.ReactNode;
  trigger: React.ReactNode | ((props: { isOpen: boolean; toggle: () => void }) => React.ReactNode);
  align?: 'left' | 'right';
  width?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  trigger,
  align = 'left',
  width = 'w-48',
  className = '',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isOpen, toggle, close } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  // Close on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape as any);
    return () => {
      document.removeEventListener('keydown', handleEscape as any);
    };
  }, [isOpen, close]);

  // Render trigger based on whether it's a function or React node
  const renderTrigger = () => {
    if (typeof trigger === 'function') {
      return trigger({ isOpen, toggle });
    }
    return trigger;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div aria-haspopup="true" aria-expanded={isOpen}>
        {renderTrigger()}
      </div>

      {isOpen && (
        <div
          className={`absolute z-20 mt-2 ${width} origin-top-right rounded border border-gray-100 bg-white py-0.5 shadow-sm transition-opacity ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
          role="menu"
          aria-orientation="vertical"
          style={{ opacity: isOpen ? 1 : 0 }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

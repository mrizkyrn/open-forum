import { Edit, MoreVertical, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDropdown } from '@/shared/hooks/useDropdown';
import { BugStatus } from '../../types';

interface BugReportDropdownActionProps {
  status: BugStatus;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  authorId?: number | null;
}

const BugReportDropdownAction = ({ status, onEdit, onDelete, authorId }: BugReportDropdownActionProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(
    'bottom-right',
  );

  const { user } = useAuth();
  const { isOpen, toggle, close } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);
  const isEditDisabled = status === BugStatus.RESOLVED || status === BugStatus.CLOSED;

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let position: typeof dropdownPosition = 'bottom-right';

      // Check if dropdown would overflow right edge
      if (rect.right > viewport.width - 10) {
        position = rect.top > viewport.height / 2 ? 'top-left' : 'bottom-left';
      }
      // Check if dropdown would overflow bottom edge
      else if (rect.bottom > viewport.height - 10) {
        position = 'top-right';
      }

      setDropdownPosition(position);
    }
  }, [isOpen]);

  const handleEdit = (e: React.MouseEvent) => {
    onEdit(e);
    close();
  };

  const handleDelete = (e: React.MouseEvent) => {
    onDelete(e);
    close();
  };

  const getDropdownClasses = () => {
    const baseClasses = 'absolute z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg';

    switch (dropdownPosition) {
      case 'bottom-left':
        return `${baseClasses} top-full left-0`;
      case 'top-right':
        return `${baseClasses} bottom-full right-0 mb-1`;
      case 'top-left':
        return `${baseClasses} bottom-full left-0 mb-1`;
      default: // bottom-right
        return `${baseClasses} top-full right-0`;
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggle}
          className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
          aria-label="More options"
        >
          <MoreVertical strokeWidth={1.5} size={20} />
        </button>

        {isOpen && (
          <div className={getDropdownClasses()}>
            {user?.id === authorId && (
              <>
                <button
                  onClick={handleEdit}
                  disabled={isEditDisabled}
                  className={`flex w-full items-center px-4 py-2 text-sm ${isEditDisabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Edit size={16} className="mr-2" />
                  Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash size={16} className="mr-2" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BugReportDropdownAction;

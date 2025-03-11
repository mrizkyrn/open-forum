import { useRef } from 'react';
import { MoreVertical, Flag, Edit, Trash } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useReport } from '@/features/reports/hooks/useReport';
import { ReportTargetType } from '@/features/reports/types';
import { useDropdown } from '@/hooks/useDropdown';

interface DiscussionDropdownActionProps {
  commentId: number;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  authorId?: number | null;
}

const DiscussionDropdownAction: React.FC<DiscussionDropdownActionProps> = ({
  commentId,
  onEdit,
  onDelete,
  authorId,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { isOpen, toggle, close } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  const { openReportModal, ReportModal } = useReport();

  const handleReport = () => {
    openReportModal(ReportTargetType.COMMENT, commentId);
    close();
  };

  const handleEdit = (e: React.MouseEvent) => {
    onEdit(e);
    close();
  };

  const handleDelete = (e: React.MouseEvent) => {
    onDelete(e);
    close();
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggle}
          className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
          aria-label="More options"
        >
          <MoreVertical strokeWidth={1.5} size={16} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-md">
            {user?.id === authorId ? (
              <>
                <button
                  onClick={handleEdit}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit size={14} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash size={14} className="mr-2" />
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={handleReport}
                className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Flag size={14} className="mr-2" />
                Report
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report modal */}
      <ReportModal />
    </>
  );
};

export default DiscussionDropdownAction;

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBookmark } from '@/features/discussions/hooks/useBookmark';
import { useReport } from '@/features/reports/hooks/useReport';
import { ReportTargetType } from '@/features/reports/types';
import { useDropdown } from '@/shared/hooks/useDropdown';
import { Bookmark, Edit, Flag, Link, MoreVertical, Trash } from 'lucide-react';
import { useRef } from 'react';

interface DiscussionDropdownActionProps {
  discussionId: number;
  isBookmarked?: boolean;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  authorId?: number | null;
}

const DiscussionDropdownAction: React.FC<DiscussionDropdownActionProps> = ({
  discussionId,
  isBookmarked,
  onEdit,
  onDelete,
  authorId,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { isOpen, toggle, close } = useDropdown(dropdownRef as React.RefObject<HTMLElement>);

  const { mutate: toggleBookmark, isPending: isBookmarkLoading } = useBookmark();
  const { openReportModal, ReportModal } = useReport();

  const handleBookmark = () => {
    toggleBookmark({ discussionId, isCurrentlyBookmarked: isBookmarked ?? false });
    close();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/discussions/${discussionId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => console.log('Link copied to clipboard:', url))
      .catch(() => console.error('Failed to copy link:', url));
    close();
  };

  const handleReport = () => {
    openReportModal(ReportTargetType.DISCUSSION, discussionId);
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
          <MoreVertical strokeWidth={1.5} size={20} />
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-md">
            <button
              onClick={handleBookmark}
              disabled={isBookmarkLoading}
              className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Bookmark size={16} className={`mr-2 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            </button>

            <button
              onClick={handleCopyLink}
              className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Link size={16} className="mr-2" />
              Copy link
            </button>

            {user?.id !== authorId && (
              <button
                onClick={handleReport}
                className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Flag size={16} className="mr-2" />
                Report
              </button>
            )}

            {user?.id === authorId && (
              <>
                <div className="my-1 border-t border-gray-100"></div>

                <button
                  onClick={handleEdit}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

      {/* Report modal */}
      <ReportModal />
    </>
  );
};

export default DiscussionDropdownAction;

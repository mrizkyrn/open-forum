import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MoreVertical, Bookmark, CheckCircle, Link, Flag, Edit, Trash, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { useBookmark } from '@/features/discussions/hooks/useBookmark';
import AvatarImage from '@/features/users/components/AvatarImage';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import { User } from '@/features/users/types/UserTypes';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useReport } from '@/features/reports/hooks/useReport';
import { ReportTargetType } from '@/features/reports/types';

interface DiscussionCardHeaderProps {
  author: User | null;
  space: {
    id: number;
    name: string;
    slug: string;
  };
  discussionId: number;
  createdAt: Date;
  isBookmarked?: boolean;
  onEditClick: () => void;
  onDelete?: () => void;
}

const DiscussionCardHeader: React.FC<DiscussionCardHeaderProps> = ({
  author,
  space,
  discussionId,
  createdAt,
  isBookmarked,
  onEditClick,
}) => {
  const { user } = useAuth();
  const { mutate: toggleBookmark, isPending: isBookmarkLoading } = useBookmark();
  const { openReportModal, ReportModal } = useReport();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isAuthor = user?.id === author?.id;
  const formattedDate = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';

  const handleBookmark = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleBookmark({ discussionId, isCurrentlyBookmarked: isBookmarked ?? false });
    setDropdownOpen(false);
  };

  const handleCopyLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const url = `${window.location.origin}/discussions/${discussionId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => console.log('Link copied to clipboard:', url))
      .catch(() => console.error('Failed to copy link:', url));
    setDropdownOpen(false);
  };

  const handleReport = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    openReportModal(ReportTargetType.DISCUSSION, discussionId);
    setDropdownOpen(false);
  };

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEditClick();
    setDropdownOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setDropdownOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await discussionApi.deleteDiscussion(discussionId);
      toast.success('Discussion deleted successfully');

      queryClient.invalidateQueries({ queryKey: ['discussions'] });
    } catch (error) {
      console.error('Failed to delete discussion:', error);
      toast.error('Failed to delete discussion');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleSpaceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigate(`/spaces/${space.slug}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex items-start justify-between">
        {/* Profile image and user details */}
        <div className="flex items-center gap-2">
          <AvatarImage avatarUrl={author?.avatarUrl} fullName={author?.fullName} size={10} />
          <div className="flex flex-col justify-center">
            {author?.fullName ? (
              <h3 className="text-base font-semibold">{author?.fullName}</h3>
            ) : (
              <h3 className="text-base font-semibold">Anonymous</h3>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <button
                onClick={handleSpaceClick}
                className="hover:text-primary cursor-pointer font-medium hover:underline"
              >
                {space.name}
              </button>
              <span>·</span>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Only show dropdown if not in delete process */}
        {!isDeleting && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleDropdownClick}
              className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
              aria-label="More options"
            >
              <MoreVertical strokeWidth={1.5} size={20} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleBookmark}
                  disabled={isBookmarkLoading}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Bookmark size={16} className={`mr-2 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  {isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  {isBookmarkLoading && <CheckCircle size={16} className="ml-2 text-green-500" />}
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Link size={16} className="mr-2" />
                  Copy link
                </button>

                <button
                  onClick={handleReport}
                  className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Flag size={16} className="mr-2" />
                  Report
                </button>

                {isAuthor && (
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
                      onClick={handleDeleteClick}
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
        )}

        {/* Show loading spinner if deleting */}
        {isDeleting && (
          <div className="flex items-center text-gray-500">
            <Loader2 size={16} className="mr-1 animate-spin" />
            <span className="text-xs">Deleting...</span>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Discussion"
        message="Are you sure you want to delete this discussion? This action cannot be undone."
        isDeleting={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      {/* Report modal */}
      <ReportModal />
    </>
  );
};

export default DiscussionCardHeader;

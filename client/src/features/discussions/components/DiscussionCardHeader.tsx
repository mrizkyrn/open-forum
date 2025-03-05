import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { MoreVertical, Bookmark, CheckCircle, Link, Flag, Edit, Trash, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { useBookmark } from '@/features/discussions/hooks/useBookmark';

interface DiscussionCardHeaderProps {
  imageUrl: string;
  fullName: string | undefined;
  discussionId: number;
  authorId?: number;
  isBookmarked?: boolean;
  onEditClick: () => void;
  onDelete?: () => void;
}

const DiscussionCardHeader: React.FC<DiscussionCardHeaderProps> = ({
  imageUrl,
  fullName,
  discussionId,
  authorId,
  isBookmarked,
  onEditClick,
}) => {
  const { user } = useAuth();
  const { mutate: toggleBookmark, isPending: isBookmarkLoading } = useBookmark();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isAuthor = user?.id === authorId;

  const handleBookmark = () => {
    toggleBookmark({ discussionId, isCurrentlyBookmarked: isBookmarked ?? false });
    setDropdownOpen(false);
  };

  const handleReport = () => {
    toast.success('Report submitted');
    setDropdownOpen(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/discussions/${discussionId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => console.log('Link copied to clipboard:', url))
      .catch(() => console.error('Failed to copy link:', url));
    setDropdownOpen(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDropdownOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await discussionApi.deleteDiscussion(discussionId);
      toast.success('Discussion deleted successfully');
      console.log('Discussion deleted:', discussionId);

      // Invalidate and refetch discussions cache
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

  const handleEdit = () => {
    onEditClick();
    setDropdownOpen(false);
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
          <img src={imageUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex flex-col justify-center">
            {fullName ? (
              <h3 className="text-base font-semibold">{fullName}</h3>
            ) : (
              <h3 className="text-base font-semibold">Anonymous</h3>
            )}
            <p className="text-xs text-gray-500">University - 5 hours ago</p>
          </div>
        </div>

        {/* Only show dropdown if not in delete process */}
        {!isDeleting && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
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
      {showDeleteConfirm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium">Delete Discussion</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this discussion? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDeleteCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="mr-2 inline animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiscussionCardHeader;

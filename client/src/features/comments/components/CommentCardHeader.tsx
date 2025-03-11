import { MoreVertical, Edit, Trash, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { User } from '@/features/users/types';

interface CommentCardHeaderProps {
  author: User;
  createdAt: Date;
  isEditing: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onReport: () => void;
}

const CommentCardHeader: React.FC<CommentCardHeaderProps> = ({
  author,
  createdAt,
  isEditing,
  onEditClick,
  onDeleteClick,
  onReport,
}) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAuthor = user?.id === author.id;
  const formattedDate = createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEditClick = () => {
    onEditClick();
    setDropdownOpen(false);
  };

  const handleDeleteClick = () => {
    onDeleteClick();
    setDropdownOpen(false);
  };

  const handleReport = () => {
    onReport();
    setDropdownOpen(false);
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{author.fullName}</span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Comment actions dropdown */}
      {!isEditing && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="cursor-pointer rounded-full p-1 hover:bg-gray-100"
          >
            <MoreVertical size={16} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {isAuthor && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit size={14} className="mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="flex w-full cursor-pointer items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash size={14} className="mr-2" />
                    Delete
                  </button>
                </>
              )}
              {!isAuthor && (
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
      )}
    </div>
  );
};

export default CommentCardHeader;

import { User } from '@/features/users/types';
import { formatDateDistance } from '@/utils/helpers';
import { Link } from 'react-router-dom';
import DiscussionDropdownAction from './CommentDropdownAction';

interface CommentCardHeaderProps {
  author: User;
  commentId: number;
  createdAt: Date;
  isEdited: boolean;
  isEditing: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  isDeleting?: boolean;
  isDeleted?: boolean;
}

const CommentCardHeader: React.FC<CommentCardHeaderProps> = ({
  author,
  commentId,
  createdAt,
  isEdited,
  isEditing,
  onEditClick,
  onDeleteClick,
  isDeleting,
  isDeleted,
}) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div>
          <div className="flex items-center gap-1">
            <Link
              to={`/profile/${author.username}`}
              className="line-clamp-1 cursor-pointer font-medium hover:underline"
            >
              {author.fullName}
            </Link>
            <span className="text-xs text-gray-500">·</span>
            <span className="min-w-fit text-xs text-gray-500">{formatDateDistance(createdAt)}</span>
            {isEdited && <span className="text-xs text-gray-500">(edited)</span>}
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {!isDeleted && !isDeleting && !isEditing && (
        <DiscussionDropdownAction
          commentId={commentId}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
          authorId={author?.id}
        />
      )}
    </div>
  );
};

export default CommentCardHeader;

import { User } from '@/features/users/types';
import { formatDateDistance } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';
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
}) => {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div>
          <div className="flex items-center gap-1">
            <Link to={`/profile/${author.username}`} className="cursor-pointer line-clamp-1 font-medium hover:underline">
              {author.fullName}
            </Link>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs min-w-fit text-gray-500">{formatDateDistance(createdAt)}</span>
            {isEdited && <span className="text-xs text-gray-500">(edited)</span>}
          </div>
        </div>
      </div> 

      {/* Dropdown menu */}
      {!isDeleting ? (
        !isEditing && (
          <DiscussionDropdownAction
            commentId={commentId}
            onEdit={onEditClick}
            onDelete={onDeleteClick}
            authorId={author?.id}
          />
        )
      ) : (
        <div className="flex items-center text-gray-500">
          <Loader2 size={16} className="mr-1 animate-spin" />
          <span className="text-xs">Deleting...</span>
        </div>
      )}
    </div>
  );
};

export default CommentCardHeader;

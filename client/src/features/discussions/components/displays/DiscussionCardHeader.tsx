import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import UserAvatar from '@/features/users/components/UserAvatar';
import { User } from '@/features/users/types';
import { formatDateDistance } from '@/utils/helpers';
import DiscussionDropdownAction from './DiscussionDropdownAction';

interface DiscussionCardHeaderProps {
  author: User | null;
  space: {
    id: number;
    name: string;
    slug: string;
  };
  discussionId: number;
  createdAt: Date;
  isEdited: boolean;
  isBookmarked?: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  isDeleting?: boolean;
}

const DiscussionCardHeader = ({
  author,
  space,
  discussionId,
  createdAt,
  isEdited,
  isBookmarked,
  onEditClick,
  onDeleteClick,
  isDeleting = false,
}: DiscussionCardHeaderProps) => {
  return (
    <div className="flex items-start justify-between">
      {/* Profile image and user details */}
      <div className="flex items-center gap-2">
        <UserAvatar fullName={author?.fullName} avatarUrl={author?.avatarUrl} size="md" username={author?.username} />

        <div className="flex flex-col justify-center">
          {author?.fullName ? (
            <Link to={`/profile/${author.username}`} className="cursor-pointer font-medium hover:underline">
              {author.fullName}
            </Link>
          ) : (
            <h3 className="text-base font-semibold">Anonymous</h3>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Link
              to={`/spaces/${space.slug}`}
              className="hover:text-primary cursor-pointer font-medium hover:underline"
            >
              {space.name}
            </Link>
            <span>·</span>
            <span>{formatDateDistance(createdAt)}</span>
            {isEdited && <span className="text-xs text-gray-500">(edited)</span>}
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {!isDeleting ? (
        <DiscussionDropdownAction
          discussionId={discussionId}
          isBookmarked={isBookmarked}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
          authorId={author?.id}
        />
      ) : (
        <div className="flex items-center text-gray-500">
          <Loader2 size={16} className="mr-1 animate-spin" />
          <span className="text-xs">Deleting...</span>
        </div>
      )}
    </div>
  );
};

export default DiscussionCardHeader;

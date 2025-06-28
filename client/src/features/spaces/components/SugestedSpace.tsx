import { getFileUrl } from '@/utils/helpers';
import { Loader2 } from 'lucide-react';

import { Space } from '@/features/spaces/types';

interface SuggestedSpaceProps {
  space: Space;
  onFollowToggle: (spaceId: number, isFollowing: boolean) => void;
  isLoading: boolean;
  isPending: boolean;
  onSpaceClick: (spaceSlug: string) => void;
}

const SuggestedSpace = ({ space, onFollowToggle, isLoading, isPending, onSpaceClick }: SuggestedSpaceProps) => {
  const buttonState = {
    disabled: isLoading && isPending,
    isFollowing: space.isFollowing,
    text:
      isLoading && isPending
        ? space.isFollowing
          ? 'Unfollowing'
          : 'Following'
        : space.isFollowing
          ? 'Following'
          : 'Follow',
    className:
      isLoading && isPending
        ? 'cursor-not-allowed bg-gray-100 text-gray-500'
        : space.isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-green-50 text-green-700 hover:bg-green-100',
  };

  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-gray-50">
      <div className="flex items-center">
        {/* Space Icon */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-700 shadow-sm">
          {space.iconUrl ? (
            <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-full w-full object-cover" />
          ) : (
            space.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Space Name and Followers */}
        <div className="ml-2.5 min-w-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSpaceClick(space.slug);
            }}
            className="line-clamp-1 cursor-pointer text-sm font-medium text-gray-800 hover:text-green-600"
          >
            {space.name}
          </div>
          <div className="text-xs text-gray-500">{space.followerCount} followers</div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onFollowToggle(space.id, space.isFollowing);
        }}
        disabled={buttonState.disabled}
        className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${buttonState.className}`}
      >
        {buttonState.disabled ? (
          <span className="flex items-center">
            <Loader2 size={10} className="mr-1 animate-spin" />
            {buttonState.text}
          </span>
        ) : (
          buttonState.text
        )}
      </button>
    </div>
  );
};

const SuggestedSpaceSkeleton = () => {
  return (
    <div className="flex items-center justify-between rounded-lg px-2 py-3">
      <div className="flex items-center">
        <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-lg bg-gray-200" />

        <div className="ml-2.5 min-w-0 space-y-1">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200 sm:w-20 md:w-24" />
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200 sm:w-14" />
        </div>
      </div>

      <div className="h-6 w-12 flex-shrink-0 animate-pulse rounded-full bg-gray-200 sm:w-14 md:w-16" />
    </div>
  );
};

export default SuggestedSpace;
export { SuggestedSpaceSkeleton };

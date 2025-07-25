import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Space } from '@/features/spaces/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { getFileUrl } from '@/utils/helpers';
import SpaceBadge from './SpaceBadge';

interface SpaceCardProps {
  space: Space;
  onFollowToggle: (spaceId: number, isFollowing: boolean) => void;
  isFollowLoading: boolean;
  followingMap: Record<number, boolean>;
}

const SpaceCard = ({ space, onFollowToggle, isFollowLoading, followingMap }: SpaceCardProps) => {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Space Banner */}
      <div className="relative h-24 w-full bg-gray-200 text-center">
        {space.bannerUrl ? (
          <img src={getFileUrl(space.bannerUrl)} alt={space.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-r from-green-400 to-green-600 px-2 text-lg font-bold text-white/50">
            {space.name}
          </div>
        )}

        {/* Space Type Badge - Absolutely positioned in banner */}
        <div className="absolute top-2 left-2">
          <SpaceBadge spaceType={space.spaceType} />
        </div>
      </div>

      {/* Centered Space Icon */}
      <div className="relative flex justify-center">
        <div className="absolute -top-6 flex-shrink-0">
          {space.iconUrl ? (
            <img
              src={getFileUrl(space.iconUrl)}
              alt={space.name}
              className="h-12 w-12 rounded-full border-2 border-white bg-white shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-green-100 font-bold text-green-600 shadow-sm">
              {space.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Space Content - More compact */}
      <div className="relative flex flex-1 flex-col justify-between p-3 pt-6">
        <div>
          {/* Space Name and Member Count */}
          <div className="mb-2 text-center">
            <h3 className="text-base font-semibold">
              <Link to={`/spaces/${space.slug}`} className="hover:text-green-600">
                {space.name}
              </Link>
            </h3>
            <div className="mt-0.5 flex items-center justify-center text-xs text-gray-500">
              <Users size={12} className="mr-1" />
              <span>{space.followerCount} followers</span>
            </div>
          </div>

          {/* Space Description - Moved up for better flow */}
          <p className="mb-4 line-clamp-2 text-center text-xs text-gray-600">
            {space.description || 'No description available.'}
          </p>
        </div>

        {/* Follow Button */}
        <MainButton
          onClick={() => onFollowToggle(space.id, space.isFollowing)}
          isLoading={isFollowLoading && followingMap[space.id]}
          variant={space.isFollowing ? 'outline' : 'primary'}
          fullWidth
          size="sm"
        >
          {space.isFollowing ? 'Following' : 'Follow'}
        </MainButton>
      </div>
    </div>
  );
};

export default SpaceCard;

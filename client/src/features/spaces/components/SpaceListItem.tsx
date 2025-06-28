import { Space, SpaceType } from '@/features/spaces/types';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { getFileUrl } from '@/utils/helpers';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SpaceListItemProps {
  space: Space;
  onFollowToggle: (spaceId: number, isFollowing: boolean) => void;
  isFollowLoading: boolean;
  followingMap: Record<number, boolean>;
}

const SpaceListItem: React.FC<SpaceListItemProps> = ({ space, onFollowToggle, isFollowLoading, followingMap }) => {
  const colors: Record<SpaceType, { bg: string; text: string }> = {
    [SpaceType.ACADEMIC]: { bg: 'bg-blue-100', text: 'text-blue-700' },
    [SpaceType.FACULTY]: { bg: 'bg-purple-100', text: 'text-purple-700' },
    [SpaceType.STUDY_PROGRAM]: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    [SpaceType.ORGANIZATION]: { bg: 'bg-orange-100', text: 'text-orange-700' },
    [SpaceType.CAMPUS]: { bg: 'bg-teal-100', text: 'text-teal-700' },
    [SpaceType.OTHER]: { bg: 'bg-gray-100', text: 'text-gray-700' },
  };

  const labels: Record<SpaceType, string> = {
    [SpaceType.ACADEMIC]: 'Academic',
    [SpaceType.FACULTY]: 'Faculty',
    [SpaceType.STUDY_PROGRAM]: 'Study Program',
    [SpaceType.ORGANIZATION]: 'Organization',
    [SpaceType.CAMPUS]: 'Campus',
    [SpaceType.OTHER]: 'Other',
  };

  return (
    <div className="flex items-center justify-between gap-7 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
      <div className="flex min-w-0 flex-grow items-start space-x-3 sm:items-center sm:space-x-4">
        {/* Space Icon */}
        <div className="flex-shrink-0">
          {space.iconUrl ? (
            <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-600 sm:h-12 sm:w-12 sm:text-xl">
              {space.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Space Info */}
        <div className="min-w-0 flex-grow">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold sm:text-base">
              <Link to={`/spaces/${space.slug}`} className="hover:text-green-600">
                {space.name}
              </Link>
            </h3>

            {/* Space Type Badge */}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${colors[space.spaceType].bg} ${colors[space.spaceType].text} font-medium`}
            >
              {labels[space.spaceType]}
            </span>
          </div>

          {/* Mobile layout: Stacked */}
          <div className="flex flex-col gap-1 sm:hidden">
            <span className="flex items-center text-xs whitespace-nowrap text-gray-500">
              <Users size={12} className="mr-1" />
              {space.followerCount} members
            </span>
            <span className="line-clamp-1 text-xs text-gray-500">{space.description || 'No description'}</span>
          </div>

          {/* Desktop layout: Inline */}
          <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            <span className="flex items-center whitespace-nowrap">
              <Users size={12} className="mr-1" />
              {space.followerCount} followers
            </span>
            <span>•</span>
            <span className="line-clamp-1">{space.description || 'No description'}</span>
          </div>
        </div>
      </div>

      {/* Follow Button */}
      <MainButton
        onClick={() => onFollowToggle(space.id, space.isFollowing)}
        isLoading={isFollowLoading && followingMap[space.id]}
        variant={space.isFollowing ? 'outline' : 'primary'}
        size="sm"
      >
        {space.isFollowing ? 'Following' : 'Follow'}
      </MainButton>
    </div>
  );
};

export default SpaceListItem;

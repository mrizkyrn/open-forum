import FeedbackDisplay from '@/components/feedback/FeedbackDisplay';
import { Space } from '@/features/spaces/types';
import SpaceCard from './SpaceCard';
import SpaceListItem from './SpaceListItem';

interface SpacesListProps {
  spaces: Space[];
  viewMode: 'grid' | 'list';
  onFollowToggle: (spaceId: number, isFollowing: boolean) => void;
  isFollowLoading: boolean;
  followingMap: Record<number, boolean>;
  searchTerm?: string;
}

const SpacesList: React.FC<SpacesListProps> = ({
  spaces,
  viewMode,
  onFollowToggle,
  isFollowLoading,
  followingMap,
  searchTerm,
}) => {
  if (spaces.length === 0) {
    return (
      <FeedbackDisplay
        title="No spaces found"
        description={searchTerm ? `No spaces match "${searchTerm}"` : 'No spaces available'}
        variant="info"
        size="md"
      />
    );
  }

  return viewMode === 'grid' ? (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 ">
      {spaces.map((space) => (
        <SpaceCard
          key={space.id}
          space={space}
          onFollowToggle={onFollowToggle}
          isFollowLoading={isFollowLoading}
          followingMap={followingMap}
        />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {spaces.map((space) => (
        <SpaceListItem
          key={space.id}
          space={space}
          onFollowToggle={onFollowToggle}
          isFollowLoading={isFollowLoading}
          followingMap={followingMap}
        />
      ))}
    </div>
  );
};

export default SpacesList;
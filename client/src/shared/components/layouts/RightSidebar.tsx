import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import PopularTopicItem, {
  PopularTopicItemSkeleton,
} from '@/features/discussions/components/displays/PopularTopicItem';
import { discussionApi } from '@/features/discussions/services';
import SuggestedSpace, { SuggestedSpaceSkeleton } from '@/features/spaces/components/SugestedSpace';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import MainButton from '@/shared/components/ui/buttons/MainButton';

interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const SectionHeader = ({ title, action }: SectionHeaderProps) => (
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    {action && (
      <button
        onClick={action.onClick}
        className="flex items-center text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
      >
        {action.label}
        <ChevronRight size={14} className="ml-0.5" />
      </button>
    )}
  </div>
);

const RightSidebar = () => {
  const navigate = useNavigate();
  const { followSpace, unfollowSpace, isLoading: followLoading, followingMap } = useSpaceFollow();

  const {
    data: popularTags,
    isLoading: isTagsLoading,
    isError: isTagsError,
  } = useQuery({
    queryKey: ['popularTags'],
    queryFn: () => discussionApi.getPopularTags({ limit: 5 }),
  });

  const { data: spacesData, isLoading: isSpacesLoading } = useQuery({
    queryKey: ['popularSpaces'],
    queryFn: () => spaceApi.getPopularSpaces({ limit: 5 }),
  });

  const handleNavigateToSpace = (slug: string) => {
    navigate(`/spaces/${slug}`);
  };

  const handleFollowToggle = (spaceId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowSpace(spaceId);
    } else {
      followSpace(spaceId);
    }
  };

  const renderTopicsContent = () => {
    if (isTagsLoading) {
      return (
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <PopularTopicItemSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (isTagsError) {
      return <div className="py-3 text-center text-xs text-gray-500">Failed to load topics</div>;
    }

    if (!popularTags?.items?.length) {
      return <div className="py-3 text-center text-xs text-gray-500">No Popular topics found</div>;
    }

    return (
      <div className="space-y-0.5">
        {popularTags.items.map((topic, index) => (
          <PopularTopicItem key={index} tag={topic.tag} count={topic.count} />
        ))}
      </div>
    );
  };

  const renderSpacesContent = () => {
    if (isSpacesLoading) {
      return (
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <SuggestedSpaceSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!spacesData?.length) {
      return <div className="py-3 text-center text-xs text-gray-500">No spaces found</div>;
    }

    return (
      <div className="space-y-1">
        {spacesData.map((space) => (
          <SuggestedSpace
            key={space.id}
            space={space}
            onFollowToggle={handleFollowToggle}
            isLoading={followLoading}
            isPending={!!followingMap[space.id]}
            onSpaceClick={handleNavigateToSpace}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="hide-scrollbar sticky top-0 h-screen overflow-y-auto border-l border-gray-200 bg-white px-4 py-4 lg:px-6">
      <MainButton variant="outline" size="xl" fullWidth onClick={() => navigate('/explore')}>
        Explore Discussions
      </MainButton>

      {/* Popular Topics */}
      <div className="my-6 rounded-lg border border-gray-200 bg-white p-4">
        <SectionHeader title="Popular Topics" action={{ label: 'View all', onClick: () => navigate('/explore') }} />
        <div className="space-y-0.5 rounded-xl">{renderTopicsContent()}</div>
      </div>

      {/* Popular Spaces */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <SectionHeader title="Spaces to Follow" action={{ label: 'View all', onClick: () => navigate('/spaces') }} />
        <div className="space-y-1 rounded-xl">{renderSpacesContent()}</div>
      </div>
    </div>
  );
};

export default RightSidebar;

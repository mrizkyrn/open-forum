import { discussionApi } from '@/features/discussions/services';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import { Space } from '@/features/spaces/types';
import { getFileUrl } from '@/utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Hash, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types for trending topics
interface TrendingTopicProps {
  tag: string;
  count: number;
}

// Trending Topic Component
const TrendingTopic = ({ tag, count }: TrendingTopicProps) => (
  <div className="group flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-green-50">
    <div className="flex items-center">
      <Hash size={16} className="mr-2 text-gray-400 group-hover:text-green-500" />
      <div>
        <div className="font-medium text-gray-800 group-hover:text-green-700">{tag}</div>
        <div className="text-xs text-gray-500">{count} discussions</div>
      </div>
    </div>
    <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500" />
  </div>
);

const SuggestedSpace = ({
  space,
  onFollowToggle,
  isLoading,
  isPending,
  onSpaceClick,
}: {
  space: Space;
  onFollowToggle: (spaceId: number, isFollowing: boolean) => void;
  isLoading: boolean;
  isPending: boolean;
  onSpaceClick: (spaceSlug: string) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg px-2 py-3 transition-colors hover:bg-gray-50">
    <div className="flex items-center">
      {/* Fixed width space icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-700 shadow-sm">
        {space.iconUrl ? (
          <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-full w-full object-cover" />
        ) : (
          space.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Clickable space name */}
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
      disabled={isLoading && isPending}
      className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        isLoading && isPending
          ? 'cursor-not-allowed bg-gray-100 text-gray-500'
          : space.isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-green-50 text-green-700 hover:bg-green-100'
      }`}
    >
      {isLoading && isPending ? (
        <span className="flex items-center">
          <Loader2 size={10} className="mr-1 animate-spin" />
          {space.isFollowing ? 'Unfollowing' : 'Following'}
        </span>
      ) : space.isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
    </button>
  </div>
);

// Section Header Component
const SectionHeader = ({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) => (
  <div className="mb-3 flex items-center justify-between">
    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
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

  // Fetch popular tags
  const {
    data: popularTags,
    isLoading: isTagsLoading,
    isError: isTagsError,
  } = useQuery({
    queryKey: ['popularTags'],
    queryFn: () => discussionApi.getPopularTags(5),
  });

  // Fetch popular spaces
  const { data: spacesData, isLoading: isSpacesLoading } = useQuery({
    queryKey: ['popularSpaces'],
    queryFn: () => spaceApi.getPopularSpaces({ limit: 5 }),
  });

  const handleNavigateToSpace = (slug: string) => {
    navigate(`/spaces/${slug}`);
  };

  // Handle follow/unfollow with the hook
  const handleFollowToggle = (spaceId: number, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowSpace(spaceId);
    } else {
      followSpace(spaceId);
    }
  };

  // Navigate to tag search
  const handleTagClick = (tag: string) => {
    navigate(`/search?tags=${tag}`);
  };

  return (
    <div className="sticky top-0 h-screen overflow-y-auto bg-white px-3 py-4 lg:border-l lg:border-gray-200 lg:px-4">
      {/* Trending Topics */}
      <div className="mb-6">
        <SectionHeader title="Trending Topics" action={{ label: 'View all', onClick: () => navigate('/search') }} />

        <div className="space-y-0.5 rounded-xl">
          {isTagsLoading ? (
            <div className="flex flex-col space-y-2 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center">
                  <div className="h-4 w-4 rounded-full bg-gray-200"></div>
                  <div className="ml-2 h-4 w-24 rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          ) : isTagsError ? (
            <div className="py-3 text-center text-xs text-gray-500">Failed to load topics</div>
          ) : (
            <>
              {popularTags && popularTags.length > 0 ? (
                <div className="space-y-0.5">
                  {popularTags.map((topic, index) => (
                    <div key={index} onClick={() => handleTagClick(topic.tag)} className="cursor-pointer">
                      <TrendingTopic tag={topic.tag} count={topic.count} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-gray-500">No trending topics found</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Popular Spaces */}
      <div>
        <SectionHeader title="Spaces to Follow" action={{ label: 'View all', onClick: () => navigate('/spaces') }} />

        <div className="space-y-1 rounded-xl">
          {isSpacesLoading ? (
            <div className="flex flex-col space-y-3 py-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center">
                  <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-gray-200"></div>
                  <div className="ml-2 min-w-0 flex-1 space-y-1">
                    <div className="h-3 w-24 rounded bg-gray-200"></div>
                    <div className="h-2 w-16 rounded bg-gray-200"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {spacesData && spacesData.length > 0 ? (
                spacesData.map((space) => (
                  <SuggestedSpace
                    key={space.id}
                    space={space}
                    onFollowToggle={handleFollowToggle}
                    isLoading={followLoading}
                    isPending={!!followingMap[space.id]}
                    onSpaceClick={handleNavigateToSpace}
                  />
                ))
              ) : (
                <div className="py-3 text-center text-xs text-gray-500">No spaces found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;

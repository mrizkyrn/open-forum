import { discussionApi } from '@/features/discussions/services';
import { spaceApi } from '@/features/spaces/services';
import { Space } from '@/features/spaces/types';
import { getFileUrl } from '@/utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Types for trending topics
interface TrendingTopicProps {
  tag: string;
  count: number;
}

// Trending Topic Component
const TrendingTopic = ({ tag, count }: TrendingTopicProps) => (
  <div className="py-3">
    <div className="font-medium">#{tag}</div>
    <div className="text-xs text-gray-500">{count} discussions</div>
  </div>
);

// Suggested Space Component for real Space data
const SuggestedSpace = ({
  space,
  onFollow,
}: {
  space: Space;
  onFollow: (spaceId: number, isFollowing: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-500">
        {space.iconUrl ? (
          <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-full w-full object-cover" />
        ) : (
          space.name.charAt(0)
        )}
      </div>
      <div className="ml-3">
        <div className="line-clamp-1 font-medium">{space.name}</div>
        <div className="text-xs text-gray-500">{space.followerCount} followers</div>
      </div>
    </div>
    <button
      onClick={() => onFollow(space.id, space.isFollowing)}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        space.isFollowing ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gray-900 text-white hover:bg-gray-700'
      }`}
    >
      {space.isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  </div>
);

const RightSidebar = () => {
  const navigate = useNavigate();
  const [followStatus, setFollowStatus] = useState<{ [key: number]: boolean }>({});

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
  const {
    data: spacesData,
    isLoading: isSpacesLoading,
    refetch,
  } = useQuery({
    queryKey: ['popularSpaces'],
    queryFn: () => spaceApi.getPopularSpaces({ limit: 5 }),
  });

  // Handle follow/unfollow
  const handleFollowSpace = async (spaceId: number, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await spaceApi.unfollowSpace(spaceId);
      } else {
        await spaceApi.followSpace(spaceId);
      }

      // Update local state for immediate UI feedback
      setFollowStatus((prev) => ({
        ...prev,
        [spaceId]: !isFollowing,
      }));

      // Refetch data to get updated follower counts
      refetch();
    } catch (error) {
      console.error('Error following/unfollowing space:', error);
    }
  };

  // Get spaces with locally updated follow status
  const spaces =
    spacesData?.map((space) => ({
      ...space,
      isFollowing: followStatus[space.id] !== undefined ? followStatus[space.id] : space.isFollowing,
    })) || [];

  // Navigate to tag search
  const handleTagClick = (tag: string) => {
    navigate(`/search?tags=${tag}`);
  };

  // Handle search
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="sticky top-0 h-screen overflow-y-auto border-l border-gray-200 bg-white p-4">
      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search..."
          className="focus:border-primary focus:ring-primary w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:outline-none"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Trending Topics */}
      <div className="mb-6 rounded-xl bg-gray-50 p-4">
        <h3 className="mb-2 font-bold">Trending Topics</h3>
        {isTagsLoading ? (
          <div className="py-4 text-center text-gray-500">Loading topics...</div>
        ) : isTagsError ? (
          <div className="py-4 text-center text-gray-500">Failed to load topics</div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {popularTags && popularTags.length > 0 ? (
                popularTags.map((topic, index) => (
                  <div key={index} onClick={() => handleTagClick(topic.tag)} className="cursor-pointer">
                    <TrendingTopic tag={topic.tag} count={topic.count} />
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">No trending topics found</div>
              )}
            </div>
            <button className="text-primary mt-3 text-sm hover:underline" onClick={() => navigate('/search')}>
              Show more
            </button>
          </>
        )}
      </div>

      {/* Popular Spaces */}
      <div className="rounded-xl bg-gray-50 p-4">
        <h3 className="mb-2 font-bold">Spaces to Follow</h3>
        {isSpacesLoading ? (
          <div className="py-4 text-center text-gray-500">Loading spaces...</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {spaces.length > 0 ? (
              spaces.map((space) => <SuggestedSpace key={space.id} space={space} onFollow={handleFollowSpace} />)
            ) : (
              <div className="py-4 text-center text-gray-500">No spaces found</div>
            )}
          </div>
        )}
        <button className="text-primary mt-3 text-sm hover:underline" onClick={() => navigate('/spaces')}>
          Show more
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;

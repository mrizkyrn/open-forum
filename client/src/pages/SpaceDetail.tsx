import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DiscussionFeed, NewDiscussionButton } from '@/features/discussions/components';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import BackButton from '@/shared/components/ui/buttons/BackButton';
import { useSocket } from '@/shared/hooks/useSocket';
import { getFileUrl } from '@/utils/helpers';

const SpaceDetailPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { socket, isConnected } = useSocket();
  const { followSpace, unfollowSpace, followingMap } = useSpaceFollow();

  const { data: space, isLoading: spaceLoading } = useQuery({
    queryKey: ['space', slug],
    queryFn: () => spaceApi.getSpaceBySlug(slug as string),
    enabled: !!slug,
  });

  const isFollowLoading = space ? followingMap[space.id] : false;

  const handleToggleFollow = () => {
    if (!space) return;

    if (!space.isFollowing) {
      followSpace(space.id);
    } else {
      unfollowSpace(space.id);
    }
  };

  useEffect(() => {
    if (!socket || !isConnected || !space?.id) return;

    socket.emit('joinSpace', { spaceId: space.id });

    return () => {
      socket.emit('leaveSpace', { spaceId: space.id });
    };
  }, [socket, isConnected, space?.id]);

  if (spaceLoading) {
    return <LoadingIndicator fullWidth />;
  }

  if (!space) {
    return (
      <FeedbackDisplay
        variant="error"
        title="Space not found"
        description="The space you're looking for doesn't exist or has been removed."
        actions={[
          {
            label: 'Browse Spaces',
            variant: 'outline',
            onClick: () => navigate('/spaces'),
          },
        ]}
        size="md"
      />
    );
  }

  return (
    <div className="w-full">
      {/* Back button */}
      <BackButton />

      {/* Space header */}
      <div className="mb-4 rounded-lg border border-gray-100 bg-white sm:mb-6">
        <div className="h-28 w-full overflow-hidden bg-gray-200 sm:h-36 md:h-44">
          {space.bannerUrl ? (
            <img src={getFileUrl(space.bannerUrl)} alt={space.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold text-gray-400 sm:text-2xl md:text-3xl">
              {space.name}
            </div>
          )}
        </div>

        {/* Space Details */}
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Space Icon and Info */}
            <div className="flex items-center gap-3 sm:gap-4">
              {space.iconUrl ? (
                <img
                  src={getFileUrl(space.iconUrl)}
                  alt={space.name}
                  className="h-12 w-12 flex-shrink-0 rounded-full sm:h-14 sm:w-14 md:h-16 md:w-16"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-600 sm:h-14 sm:w-14 sm:text-xl md:h-16 md:w-16 md:text-2xl">
                  {space.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold sm:text-2xl">{space.name}</h1>
                <div className="flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                  <Users size={14} className="flex-shrink-0" />
                  <span>
                    {space.followerCount} {space.followerCount === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
              </div>
            </div>

            {/* Follow button */}
            <button
              onClick={handleToggleFollow}
              disabled={isFollowLoading}
              className={`self-start rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap sm:self-auto sm:px-4 sm:py-2 ${
                isFollowLoading
                  ? 'cursor-wait opacity-70'
                  : space.isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isFollowLoading ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>{space.isFollowing ? 'Unfollowing...' : 'Following...'}</span>
                </span>
              ) : (
                <span>{space.isFollowing ? 'Unfollow' : 'Follow'}</span>
              )}
            </button>
          </div>

          {/* Space Description */}
          {space.description && (
            <p className="mt-3 line-clamp-3 text-sm text-gray-700 sm:mt-4 sm:line-clamp-none sm:text-base">
              {space.description}
            </p>
          )}
        </div>
      </div>

      {/* Discussions Section */}
      <div className="flex w-full flex-col">
        <NewDiscussionButton preselectedSpaceId={space.id} className="mb-4" />
        <DiscussionFeed preselectedSpaceId={space.id} search={{ spaceId: space.id }} />
      </div>
    </div>
  );
};

export default SpaceDetailPage;

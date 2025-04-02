import FeedbackDisplay from '@/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/components/feedback/LoadinIndicator';
import BackButton from '@/components/ui/buttons/BackButton';
import { DiscussionPost } from '@/features/discussions/components';
import NewDiscussionButton from '@/features/discussions/components/DiscussionPost/NewDiscussionButton';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { spaceApi } from '@/features/spaces/services';
import { useSocket } from '@/hooks/useSocket';
import { getFileUrl } from '@/utils/helpers';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const SpaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { socket, isConnected } = useSocket();
  const { followSpace, unfollowSpace, followingMap } = useSpaceFollow();
  const { data: space, isLoading: spaceLoading } = useQuery({
    queryKey: ['space', slug],
    queryFn: () => spaceApi.getSpaceBySlug(slug as string),
    enabled: !!slug,
  });

  const isFollowLoading = space ? followingMap[space.id] : false;

  useEffect(() => {
    if (!socket || !isConnected || !space?.id) return;

    socket.emit('joinSpace', { spaceId: space.id });
    console.log(`Joined space room: ${space.id}`);

    return () => {
      socket.emit('leaveSpace', { spaceId: space.id });
      console.log(`Left space room: ${space.id}`);
    };
  }, [socket, isConnected, space?.id]);

  const toggleFollow = () => {
    if (!space) return;

    if (!space.isFollowing) {
      followSpace(space.id);
    } else {
      unfollowSpace(space.id);
    }
  };

  if (spaceLoading) {
    return <LoadingIndicator />;
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
      <div className="mb-6 rounded-lg bg-white border border-gray-100">
        {/* Space Banner */}
        <div className="h-44 w-full overflow-hidden rounded-t-lg bg-gray-200">
          {space.bannerUrl ? (
            <img
              src={getFileUrl(space.bannerUrl)}
              alt={space.name}
              className="h-full w-full overflow-hidden object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-bold text-gray-400">{space.name}</div>
          )}
        </div>

        {/* Space Details */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            {/* Space Icon and Name */}
            <div className="flex items-center gap-4">
              {space.iconUrl ? (
                <img src={getFileUrl(space.iconUrl)} alt={space.name} className="h-16 w-16 rounded-full" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-600">
                  {space.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{space.name}</h1>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users size={16} />
                  <span>
                    {space.followerCount} {space.followerCount === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
              </div>
            </div>

            {/* Follow button */}
            <button
              onClick={toggleFollow}
              disabled={isFollowLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                isFollowLoading
                  ? 'cursor-wait opacity-70'
                  : space.isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {space.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>

          {/* Space Description */}
          {space.description && <p className="mt-4 text-gray-700">{space.description}</p>}
        </div>
      </div>

      {/* Discussions Section */}
      <div className="flex w-full flex-col">
        <NewDiscussionButton preselectedSpaceId={space.id} className="mb-4" />
        <DiscussionPost preselectedSpaceId={space.id} search={{ spaceId: space.id }} />
      </div>
    </div>
  );
};

export default SpaceDetailPage;

import { useParams, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useSpace } from '@/features/spaces/hooks/useSpace';
import { useSpaceFollow } from '@/features/spaces/hooks/useSpaceFollow';
import { getFileUrl } from '@/utils/helpers';
import { DiscussionPost } from '@/features/discussions/components';
import LoadingSpinner from '@/components/feedback/LoadingSpinner';
import BackButton from '@/components/ui/buttons/BackButton';

const SpaceDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const navigate = useNavigate();

  const { data: space, isLoading: spaceLoading } = useSpace(slug as string);
  const { followSpace, unfollowSpace, isLoading: followLoading } = useSpaceFollow();

  const toggleFollow = () => {
    if (!space) return;

    if (!space.isFollowing) {
      followSpace(space.id);
    } else {
      unfollowSpace(space.id);
    }
  };

  if (spaceLoading) {
    return <LoadingSpinner />;
  }

  if (!space) {
    return (
      <div className="flex flex-col items-center p-8 text-center">
        <h2 className="mb-4 text-xl font-bold">Space not found</h2>
        <p className="mb-4 text-gray-600">The space you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/spaces')}
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Browse Spaces
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Back button */}
      <BackButton />

      {/* Space header */}
      <div className="mb-6 rounded-lg bg-white">
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
                <img src={space.iconUrl} alt={space.name} className="h-16 w-16 rounded-full" />
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
              disabled={followLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                followLoading
                  ? 'cursor-wait opacity-70'
                  : space?.isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {followLoading ? 'Processing...' : space?.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>

          {/* Space Description */}
          {space.description && <p className="mt-4 text-gray-700">{space.description}</p>}
        </div>
      </div>

      {/* Discussion post */}
      <DiscussionPost preselectedSpaceId={space.id} search={{ spaceId: space.id }} />
    </div>
  );
};

export default SpaceDetailPage;

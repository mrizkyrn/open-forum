import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { ArrowLeft } from 'lucide-react';
import DiscussionCardHeader from '@/features/discussions/components/DiscussionCardHeader';
import DiscussionCardBody from '@/features/discussions/components/DiscussionCardBody';
import DiscussionCardFooter from '@/features/discussions/components/DiscussionCardFooter';
import Comments from '@/features/comments/components/Comments';
import CommentForm from '@/features/comments/components/CommentForm';
import UpdateDiscussionModal from '@/features/discussions/components/UpdateDiscussionModal';
import { useState } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DiscussionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const discussionId = parseInt(id || '0', 10);

  const {
    data: discussion,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['discussions', discussionId],
    queryFn: () => discussionApi.getDiscussionById(discussionId),
    enabled: !!discussionId && !isNaN(discussionId),
  });

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleVoteChange = () => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (isError || !discussion) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-8">
        <div className="flex flex-col items-center rounded-lg bg-red-50 p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-red-700">Error Loading Discussion</h2>
          <p className="mb-6 text-red-600">
            {error instanceof Error ? error.message : 'This discussion could not be found or may have been deleted.'}
          </p>
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-xl px-4 py-8">
        {/* Back button */}
        <button onClick={handleBackClick} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} />
          <span>Back to discussions</span>
        </button>

        {/* Main discussion card */}
        <div className="mb-8 overflow-hidden rounded-xl bg-white">
          {/* Discussion content */}
          <div className="flex flex-col gap-4 px-6 py-6">
            <DiscussionCardHeader
              fullName={discussion.author?.fullName}
              discussionId={discussion.id}
              authorId={discussion.author?.id}
              isBookmarked={discussion.isBookmarked}
              onEditClick={handleEditClick}
            />

            <DiscussionCardBody content={discussion.content} attachments={discussion.attachments} />

            {/* Tags */}
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {discussion.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <hr className="my-2 border-gray-200" />

            {/* Enhanced vote UI with status and callback */}
            <div className="px-2">
              {' '}
              {/* Add padding for better spacing */}
              <DiscussionCardFooter
                discussionId={discussion.id}
                upvoteCount={discussion.upvoteCount}
                downvoteCount={discussion.downvoteCount}
                commentCount={discussion.commentCount}
                voteStatus={discussion.voteStatus}
                onVoteChange={handleVoteChange}
              />
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="mt-8 rounded-xl bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Comments ({discussion.commentCount || 0})</h2>

          {/* Comment form */}
          <div className="mb-6">
            <CommentForm discussionId={discussion.id} />
          </div>

          {/* Comments list */}
          <Comments discussionId={discussion.id} />
        </div>
      </div>

      {/* Edit discussion modal */}
      <UpdateDiscussionModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} discussion={discussion} />
    </>
  );
};

export default DiscussionDetail;

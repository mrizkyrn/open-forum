import { DiscussionPost } from '@/features/discussions/components';

const BookmarksPage = () => {
  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-2xl font-bold">Bookmarked Discussions</h1>

      <DiscussionPost feedType="bookmarked" />
    </div>
  );
};

export default BookmarksPage;

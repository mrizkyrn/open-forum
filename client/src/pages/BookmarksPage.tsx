import { DiscussionPost } from '@/features/discussions/components';

const BookmarksPage = () => {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Bookmarked Discussions</h1>
        <p className="mt-1 text-sm text-gray-500">Save discussions to read later</p>
      </div>

      <DiscussionPost feedType="bookmarked" />
    </div>
  );
};

export default BookmarksPage;

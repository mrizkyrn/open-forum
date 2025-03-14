import { DiscussionSortBy, SortOrder, SearchDiscussionDto } from '@/features/discussions/types/DiscussionRequestTypes';
import DiscussionPost from '@/features/discussions/components/DiscussionPost/DiscussionPost';
import NewDiscussionButton from '@/features/discussions/components/DiscussionPost/NewDiscussionButton';

const Home = () => {
  const searchRequest: SearchDiscussionDto = {
    page: 1,
    limit: 5,
    sortBy: DiscussionSortBy.createdAt,
    sortOrder: SortOrder.DESC,
  };

  return (
    <div className="flex w-full flex-col">
      <NewDiscussionButton className="mb-4" />
      <DiscussionPost search={searchRequest} />
    </div>
  );
};

export default Home;

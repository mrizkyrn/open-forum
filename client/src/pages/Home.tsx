import { DiscussionSortBy, SortOrder, SearchDiscussionDto } from '@/features/discussions/types/DiscussionRequestTypes';
import DiscussionPost from '@/features/discussions/components/DiscussionPost';

const Home = () => {
  const searchRequest: SearchDiscussionDto = {
    page: 1,
    limit: 5,
    sortBy: DiscussionSortBy.createdAt,
    sortOrder: SortOrder.DESC,
  };

  return (
    <div className="flex w-full flex-col">
      <DiscussionPost preselectedSpaceId={1} search={searchRequest} />
    </div>
  );
};

export default Home;

import DiscussionPost from '@/features/discussions/components/DiscussionPost/DiscussionPost';
import NewDiscussionButton from '@/features/discussions/components/DiscussionPost/NewDiscussionButton';
import { DiscussionSortBy, SearchDiscussionDto } from '@/features/discussions/types';
import { SortOrder } from '@/types/SearchTypes';

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

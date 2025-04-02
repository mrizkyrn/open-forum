import DiscussionPost from '@/features/discussions/components/DiscussionPost/DiscussionPost';
import NewDiscussionButton from '@/features/discussions/components/DiscussionPost/NewDiscussionButton';

const HomePage = () => {
  return (
    <div className="flex w-full flex-col">
      <NewDiscussionButton className="mb-4" />
      <DiscussionPost />
    </div>
  );
};

export default HomePage;

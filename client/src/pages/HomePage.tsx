import DiscussionPost from '@/features/discussions/components/DiscussionPost/DiscussionPost';
import NewDiscussionButton from '@/features/discussions/components/DiscussionPost/NewDiscussionButton';
import { Clock, Star } from 'lucide-react';
import { useState } from 'react';

type HomeTab = 'latest' | 'following';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<HomeTab>('latest');

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex w-full flex-col">
      <NewDiscussionButton className="rounded-b-none" />

      {/* Tab Navigation */}
      <div className="mb-4 border-b border-gray-200 bg-white">
        <nav className="flex" aria-label="Home Tabs">
          <button
            className={`flex w-full items-center justify-center border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'latest'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('latest')}
            aria-current={activeTab === 'latest' ? 'page' : undefined}
          >
            <Clock size={16} className="mr-2" />
            Latest
          </button>
          <button
            className={`flex w-full items-center justify-center border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'following'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('following')}
            aria-current={activeTab === 'following' ? 'page' : undefined}
          >
            <Star size={16} className="mr-2" />
            Following
          </button>
        </nav>
      </div>

      {/* Discussion Content based on active tab */}
      <DiscussionPost search={activeTab === 'following' ? { onlyFollowedSpaces: true } : {}} />
    </div>
  );
};

export default HomePage;

import { Clock, Star } from 'lucide-react';
import { useState } from 'react';

import { DiscussionFeed, NewDiscussionButton } from '@/features/discussions/components';
import TabNavigation from '@/shared/components/layouts/TabNavigation';

type HomeTab = 'latest' | 'following';

const TAB_CONFIG = {
  latest: {
    icon: <Clock size={16} />,
    label: 'Latest',
    searchProps: {},
  },
  following: {
    icon: <Star size={16} />,
    label: 'Following',
    searchProps: { onlyFollowedSpaces: true },
  },
} as const;

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<HomeTab>('latest');

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex w-full flex-col">
      <TabNavigation
        tabs={TAB_CONFIG}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="border border-b-0 border-gray-100"
        ariaLabel="Home Tabs"
      />

      <NewDiscussionButton className="mb-4 rounded-b-none" />

      <DiscussionFeed search={activeTab === 'following' ? { onlyFollowedSpaces: true } : {}} />
    </div>
  );
};

export default HomePage;

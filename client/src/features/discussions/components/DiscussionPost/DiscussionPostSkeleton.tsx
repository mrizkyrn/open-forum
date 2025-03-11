import React from 'react';
import DiscussionCardSkeleton from '../DiscussionCard/DiscussionCardSkeleton';

interface DiscussionPostSkeletonProps {
  count?: number;
}

const DiscussionPostSkeleton: React.FC<DiscussionPostSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="container mx-auto max-w-xl px-4">
      <div className="flex flex-col items-center gap-2">
        {/* Post input skeleton */}
        <div className="flex w-full items-center gap-2 rounded-xl bg-white p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
          <div className="h-8 w-full animate-pulse rounded-full bg-gray-200"></div>
        </div>

        {/* Generate multiple discussion card skeletons */}
        {Array.from({ length: count }).map((_, index) => (
          <DiscussionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default DiscussionPostSkeleton;

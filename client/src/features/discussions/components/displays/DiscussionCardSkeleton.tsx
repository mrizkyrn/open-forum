const DiscussionCardSkeleton = () => {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-white p-4">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Profile picture skeleton */}
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
          <div className="flex flex-col gap-1">
            {/* Username skeleton */}
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
            {/* Date skeleton */}
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
        {/* Options button skeleton */}
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-col gap-2">
        {/* Text lines */}
        <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
        <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Image attachment skeleton (optional) */}
      <div className="grid grid-cols-2 gap-1">
        <div className="h-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-32 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Footer skeleton */}
      <div className="flex justify-between">
        <div className="flex items-center gap-4">
          {/* Vote skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-6 animate-pulse rounded bg-gray-200"></div>
            <div className="h-6 w-6 animate-pulse rounded bg-gray-200"></div>
          </div>
          {/* Comment count skeleton */}
          <div className="flex items-center gap-1">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionCardSkeleton;

import FeedbackDisplay from '@/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/components/feedback/LoadinIndicator';
import UserAvatar from '@/components/layouts/UserAvatar';
import { userApi } from '@/features/users/services';
import { SearchUserParams } from '@/features/users/types';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useInfiniteQuery } from '@tanstack/react-query';
import { UserIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

interface UsersListProps {
  searchTerm: string;
}

const UsersList: React.FC<UsersListProps> = ({ searchTerm }) => {
  const {
    data: usersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useInfiniteQuery({
    queryKey: ['searchUsers', searchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const params: SearchUserParams = {
        page: pageParam,
        limit: 10,
        search: searchTerm,
      };
      return await userApi.getUsers(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasNextPage ? lastPage.meta.currentPage + 1 : undefined;
    },
    enabled: !!searchTerm,
  });

  const { entry, observerRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: !!hasNextPage && !isFetchingNextPage,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  // Flatten the pages of users
  const allUsers = usersData?.pages ? usersData.pages.flatMap((page) => page.items) : [];

  if (isLoadingUsers && allUsers.length === 0) {
    return <LoadingIndicator text="Searching for users..." fullWidth className="py-6" />;
  }

  if (isErrorUsers) {
    return (
      <FeedbackDisplay
        title="Error loading users"
        description="There was an error loading users. Please try again later."
        variant="error"
        actions={[
          {
            label: "Retry",
            onClick: () => fetchNextPage(),
            variant: "outline",
          },
        ]}
      />
    );
  }

  if (allUsers.length === 0) {
    return (
      <FeedbackDisplay
        title="No users found"
        description="We couldn't find any users matching your search."
        icon={<UserIcon size={32} className="text-gray-300" />}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-b-md border border-t-0 border-gray-100 bg-white p-2">
        {allUsers.map((user) => (
          <Link
            key={user.id}
            to={`/profile/${user.username}`}
            className="group flex items-center rounded-md px-3 py-2.5 transition-colors hover:bg-gray-100"
          >
            <div className="mr-3 overflow-hidden rounded-full bg-gray-100">
              <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-gray-800">{user.fullName}</span>
              </div>
              <span className="text-xs text-gray-500">@{user.username}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Loading more indicator */}
      {isFetchingNextPage && <LoadingIndicator text="Loading more users..." />}

      {/* Invisible element for intersection observer */}
      {hasNextPage && <div ref={observerRef} className="h-5" />}
    </>
  );
};

export default UsersList;
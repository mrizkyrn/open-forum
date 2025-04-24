import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreateDiscussionModal } from '@/features/discussions/components';
import UserAvatar from '@/features/users/components/UserAvatar';
import { useState } from 'react';

interface NewDiscussionButtonProps {
  preselectedSpaceId?: number;
  className?: string;
}

const NewDiscussionButton: React.FC<NewDiscussionButtonProps> = ({ preselectedSpaceId = 1, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div className={`flex w-full items-center gap-2 border border-gray-100 bg-white p-4 ${className}`}>
        <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="sm" />
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full rounded-full bg-gray-100 px-4 py-2 text-left text-gray-600 transition-colors hover:bg-gray-200 focus:outline-none"
        >
          What's on your mind?
        </button>
      </div>

      <CreateDiscussionModal
        preselectedSpaceId={preselectedSpaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default NewDiscussionButton;

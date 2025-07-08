import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, isAfter, subMinutes } from 'date-fns';
import { Calendar, Clock, MapPin, School, User, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { DiscussionFeed } from '@/features/discussions/components';
import AvatarUpload from '@/features/users/components/AvatarUpload';
import UserAvatar from '@/features/users/components/UserAvatar';
import { userApi } from '@/features/users/services';
import { UserRole } from '@/features/users/types';
import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import TabNavigation from '@/shared/components/layouts/TabNavigation';
import BackButton from '@/shared/components/ui/buttons/BackButton';

type ProfileTab = 'profile' | 'discussions';

const TAB_CONFIG = {
  profile: {
    icon: <User size={16} />,
    label: 'Profile',
  },
  discussions: {
    icon: <Calendar size={16} />,
    label: 'Discussions',
  },
} as const;

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<'profile' | 'discussions'>('profile');

  const { user: currentUser } = useAuth();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => userApi.getUserByUsername(username as string),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!username,
  });

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return <LoadingIndicator fullWidth />;
  }

  if (error || !user || user.role === UserRole.ADMIN) {
    return (
      <FeedbackDisplay
        title="User Profile Not Found"
        description="We couldn't find this user profile or you don't have permission to view it."
        icon={<User className="h-10 w-10 text-gray-400" />}
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <div className="from-primary-lighter to-primary-dark relative h-32 bg-gradient-to-r">
          {currentUser?.id !== user.id && (
            <div className="absolute top-4 left-4 z-10">
              <BackButton className="text-white" />
            </div>
          )}

          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              {currentUser?.id === user.id ? (
                <AvatarUpload currentAvatarUrl={user.avatarUrl ?? null} fullName={user.fullName} size="24" onSuccess={() => {}} />
              ) : (
                <UserAvatar
                  fullName={user.fullName}
                  avatarUrl={user.avatarUrl}
                  size={24}
                  className="border-4 border-white"
                />
              )}
              <div className="absolute -right-1 -bottom-1 rounded-full bg-green-500 p-1.5">
                <UserCheck className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{user.fullName}</h1>
              <div className="mt-1 flex items-center gap-2 text-gray-500">
                <span className="text-sm font-medium">@{user.username}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              {user.lastActiveAt && (
                <div className="text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isAfter(new Date(user.lastActiveAt), subMinutes(new Date(), 10))
                      ? 'Currently online'
                      : `Last active ${formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <TabNavigation tabs={TAB_CONFIG} activeTab={activeTab} onTabChange={handleTabChange} ariaLabel="Profile Tabs" />
      </div>

      {/* Details section */}
      {activeTab === 'profile' ? (
        <>
          {/* Academic Information */}
          <div className="rounded-lg border border-gray-100 bg-white p-6">
            <h2 className="text-lg font-medium text-gray-900">Academic Information</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                {user.faculty && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Faculty</div>
                      <div className="text-sm text-gray-600">{user.faculty.facultyName}</div>
                    </div>
                  </div>
                )}

                {user.studyProgram && (
                  <div className="flex items-start gap-3">
                    <School className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Study Program</div>
                      <div className="text-sm text-gray-600">{user.studyProgram.studyProgramName}</div>
                    </div>
                  </div>
                )}

                {user.educationLevel && (
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Education Level</div>
                      <div className="text-sm text-gray-600">{user.educationLevel}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {user.batchYear && (
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Batch Year</div>
                      <div className="text-sm text-gray-600">{user.batchYear}</div>
                    </div>
                  </div>
                )}

                {user.gender && (
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Gender</div>
                      <div className="text-sm text-gray-600">
                        {user.gender === 'L' ? 'Male' : user.gender === 'P' ? 'Female' : user.gender}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="rounded-lg border border-gray-100 bg-white p-6">
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Member Since</div>
                  <div className="text-sm text-gray-600">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Last Active</div>
                  <div className="text-sm text-gray-600">
                    {user.lastActiveAt ? format(new Date(user.lastActiveAt), 'MMMM d, yyyy') : 'No activity recorded'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <DiscussionFeed search={{ authorId: user.id }} />
      )}
    </div>
  );
};

export default UserProfilePage;

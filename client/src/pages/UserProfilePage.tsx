import FeedbackDisplay from '@/components/feedback/FeedbackDisplay';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DiscussionPost } from '@/features/discussions/components';
import AvatarUpload from '@/features/users/components/AvatarUpload';
import { userApi } from '@/features/users/services';
import { UserRole } from '@/features/users/types';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, isAfter, subMinutes } from 'date-fns';
import { Calendar, Clock, MapPin, School, User, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

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

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
      </div>
    );
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
      {/* Header with avatar and basic info */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <div className="from-primary-lighter to-primary-dark relative h-32 bg-gradient-to-r">
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              {currentUser?.id === user.id ? (
                <AvatarUpload
                  currentAvatarUrl={user.avatarUrl ?? null}
                  size="24"
                  onSuccess={() => {
                    // User profile will be refreshed automatically via queryClient invalidation
                  }}
                />
              ) : (
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                </div>
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

        {/* Navigation Tabs */}
        <div className="border-t border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'profile' ? 'border-primary text-primary border-b-2' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'discussions'
                  ? 'border-primary text-primary border-b-2'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Discussions
            </button>
          </div>
        </div>
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
        <div className="rounded-lg border border-gray-100 bg-white p-4">
          <DiscussionPost search={{ authorId: user.id }} />
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, MessageCircle, Flag, Activity, Calendar, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '@/features/admin/services/adminApi';
import { TimePeriod } from '@/features/admin/types';
import StatCard from '@/features/admin/components/StatCard';
import LineChart from '@/features/admin/components/LineChart';

const OverviewPage = () => {
  const [statsFilter, setStatsFilter] = useState<TimePeriod>('day');
  const [activityFilter, setActivityFilter] = useState<TimePeriod>('week');
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setSelectOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['adminStats', statsFilter],
    queryFn: () => adminApi.getDashboardStats({ period: statsFilter }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch activity data
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useQuery({
    queryKey: ['adminActivity', activityFilter],
    queryFn: () => adminApi.getActivityData({ timeRange: activityFilter }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (statsError) {
    return (
      <div className="flex h-[350px] w-full flex-col items-center justify-center text-center">
        <BarChart3 className="text-muted-foreground h-10 w-10" />
        <h3 className="mt-4 text-lg font-medium">Failed to load dashboard stats</h3>
        <p className="text-muted-foreground text-sm">There was a problem loading the dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title and stats filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>

        <div ref={selectRef} className="relative">
          <button
            onClick={() => setSelectOpen(!selectOpen)}
            className="group focus:ring-primary/20 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm transition-all hover:bg-gray-100 sm:w-auto"
          >
            <div className="flex items-center gap-2">
              <Calendar className="group-hover:text-primary h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {statsFilter === 'day' ? 'Last 24 Hours' : statsFilter === 'week' ? 'Last Week' : 'Last Month'}
              </span>
            </div>
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`text-gray-400 transition-transform duration-200 ${selectOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {selectOpen && (
            <div className="animate-in fade-in zoom-in-95 absolute right-0 z-10 mt-1 min-w-[180px] origin-top-right rounded-lg border border-gray-100 bg-white shadow-sm duration-100">
              <div className="py-1">
                {[
                  { value: 'day', label: 'Last 24 Hours' },
                  { value: 'week', label: 'Last Week' },
                  { value: 'month', label: 'Last Month' },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                      statsFilter === option.value ? 'bg-primary/5 text-primary font-medium' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setStatsFilter(option.value as TimePeriod);
                      setSelectOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Users Card */}
      <div className="from-primary/5 rounded-xl border-gray-100 bg-gradient-to-br to-white">
        <div className="p-6">
          <div className="mb-4 flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <UserCheck className="text-primary h-5 w-5" />
                Active Users
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">
                Users active in the last {statsFilter === 'day' ? '24 hours' : statsFilter}
              </p>
            </div>
            {!statsLoading && (
              <div className="mt-2 rounded-lg border border-gray-100 bg-white px-4 py-2 sm:mt-0">
                <div className="text-xs text-gray-500">Activity Rate</div>
                <div className="text-xl font-bold">
                  {Math.round(((stats?.users.active ?? 0) / (stats?.users.total ?? 1)) * 100)}%
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col rounded-lg border border-gray-100 bg-white p-4">
              <span className="text-xs text-gray-500">Active</span>
              <span className="mt-1 text-2xl font-bold">{statsLoading ? '-' : stats?.users.active}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                <UserCheck size={14} />
                <span>Currently online</span>
              </span>
            </div>

            <div className="flex flex-col rounded-lg border border-gray-100 bg-white p-4">
              <span className="text-xs text-gray-500">Inactive</span>
              <span className="mt-1 text-2xl font-bold">
                {statsLoading ? '-' : (stats?.users.total ?? 0) - (stats?.users.active ?? 0)}
              </span>
              <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                <UserX size={14} />
                <span>Not logged in</span>
              </span>
            </div>

            <div className="flex flex-col rounded-lg border border-gray-100 bg-white p-4">
              <span className="text-xs text-gray-500">Total Users</span>
              <span className="mt-1 text-2xl font-bold">{statsLoading ? '-' : stats?.users.total}</span>
              <span className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <Users size={14} />
                <span>Registered accounts</span>
              </span>
            </div>
          </div>

          {!statsLoading && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="mb-2 flex justify-between">
                <span className="text-xs text-gray-500">Active vs. Total Users</span>
                <span className="text-xs font-medium">
                  {stats?.users.active} / {stats?.users.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${Math.round(((stats?.users.active ?? 0) / (stats?.users.total ?? 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users.total}
          subtitle="registered"
          icon={Users}
          change={stats?.users.change || 0}
          isLoading={statsLoading}
        />
        <StatCard
          title="Discussions"
          value={stats?.discussions.total}
          subtitle="topics"
          icon={MessageCircle}
          change={stats?.discussions.change || 0}
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Reports"
          value={stats?.reports.active}
          subtitle="pending"
          icon={Flag}
          change={stats?.reports.change || 0}
          isLoading={statsLoading}
        />
        <StatCard
          title="User Engagement"
          value={stats?.engagement.rate}
          subtitle={`${stats?.engagement.interactions} interactions`}
          icon={Activity}
          change={stats?.engagement.change || 0}
          isLoading={statsLoading}
        />
      </div>

      {/* Activity Chart */}
      <div className="rounded-lg border-gray-100 bg-white">
        <div className="flex flex-row items-center justify-between p-6">
          <div className="flex-1">
            <h3 className="text-xl leading-none font-semibold tracking-tight">Activity Overview</h3>
            <p className="mt-1 text-sm text-gray-500">Platform activity over time</p>
          </div>

          {/* Simple Tabs */}
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-50 p-1 text-gray-600">
            {['day', 'week', 'month'].map((tab) => (
              <button
                key={tab}
                className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
                  activityFilter === tab ? 'text-primary border-gray-100 bg-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setActivityFilter(tab as TimePeriod)}
              >
                {tab === 'day' ? '24h' : tab === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0">
          {activityLoading && (
            <div className="flex h-[350px] w-full items-center justify-center">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
            </div>
          )}

          {activityError && (
            <div className="flex h-[350px] w-full flex-col items-center justify-center text-center">
              <BarChart3 className="h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">Failed to load chart data</h3>
              <p className="text-sm text-gray-500">There was a problem loading the activity data.</p>
            </div>
          )}

          {activity && !activityLoading && !activityError && (
            <div className="h-[350px]">
              <LineChart data={activity.series} />
            </div>
          )}
        </div>
      </div>

      {/* Key Insights Summary */}
      {stats && activity && (
        <div className="rounded-lg bg-white p-6 border-gray-100">
          <h3 className="mb-4 text-lg font-semibold">Key Insights</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2 text-green-600">
                <MessageCircle size={16} />
              </div>
              <div>
                <h4 className="font-medium">Discussion Activity</h4>
                <p className="text-sm text-gray-600">
                  {activity.series[0].data.reduce((sum, point) => sum + point.value, 0)} new discussions created
                  {activity.series[0].data.length > 1
                    ? ', with the highest activity on ' +
                      new Date(activity.series[0].data[0].date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                <Activity size={16} />
              </div>
              <div>
                <h4 className="font-medium">Engagement Overview</h4>
                <p className="text-sm text-gray-600">
                  Total of {stats.engagement.interactions} interactions with an engagement rate of{' '}
                  {stats.engagement.rate}
                  {stats.engagement.change > 0
                    ? `, up ${stats.engagement.change}% from previous period`
                    : stats.engagement.change < 0
                      ? `, down ${Math.abs(stats.engagement.change)}% from previous period`
                      : ', unchanged from previous period'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-100 p-2 text-purple-600">
                <UserCheck size={16} />
              </div>
              <div>
                <h4 className="font-medium">User Participation</h4>
                <p className="text-sm text-gray-600">
                  {stats.users.active} of {stats.users.total} users (
                  {Math.round((stats.users.active / stats.users.total) * 100)}%) are active in the last{' '}
                  {statsFilter === 'day' ? '24 hours' : statsFilter}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewPage;

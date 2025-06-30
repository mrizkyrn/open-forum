import { useQuery } from '@tanstack/react-query';
import { Activity, BarChart3, Calendar, Flag, MessageCircle, UserCheck, Users, UserX } from 'lucide-react';
import { useState } from 'react';

import { LineChart, SelectFilter, StatCard } from '@/features/admin/components';
import { adminApi } from '@/features/admin/services';
import { TimePeriod } from '@/features/admin/types';

const OverviewPage = () => {
  const [statsFilter, setStatsFilter] = useState<TimePeriod>('day');
  const [activityFilter, setActivityFilter] = useState<TimePeriod>('week');

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['adminStats', statsFilter],
    queryFn: () => adminApi.getDashboardStats({ period: statsFilter }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    <div className="space-y-5">
      {/* Page title and stats filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>

        <SelectFilter
          options={[
            { value: 'day', label: 'Last 24 hours' },
            { value: 'week', label: 'Last 7 days' },
            { value: 'month', label: 'Last 30 days' },
          ]}
          value={statsFilter}
          onChange={(value) => setStatsFilter(value as TimePeriod)}
          leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
          className="min-w-[140px]"
        />
      </div>

      {/* Active Users Card */}
      <div className="rounded-lg border-gray-100 bg-white p-6">
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
        <div className="flex flex-wrap items-center justify-between gap-5 p-6">
          <div className="flex-shrink-0">
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
        <div className="rounded-lg border border-gray-100 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-lg font-medium">Key Insights</h3>
          </div>

          <div className="grid gap-px bg-gray-50 sm:grid-cols-2 lg:grid-cols-3">
            {/* Discussion Activity */}
            <div className="bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-green-500" />
                  <h4 className="text-sm font-medium text-gray-700">Discussions</h4>
                </div>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                  +{activity.series[0].data.reduce((sum, point) => sum + point.value, 0)}
                </span>
              </div>
              <div className="text-2xl font-semibold">{stats.discussions.total}</div>
              <div className="mt-1 text-xs text-gray-500">
                {activity.series[0].data.length > 1 && (
                  <>
                    Highest on{' '}
                    {new Date(activity.series[0].data[0].date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Engagement Overview */}
            <div className="bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-blue-500" />
                  <h4 className="text-sm font-medium text-gray-700">Engagement</h4>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    stats.engagement.change > 0
                      ? 'bg-green-50 text-green-600'
                      : stats.engagement.change < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {stats.engagement.change > 0
                    ? `+${stats.engagement.change}%`
                    : stats.engagement.change < 0
                      ? `${stats.engagement.change}%`
                      : 'unchanged'}
                </span>
              </div>
              <div className="text-2xl font-semibold">{stats.engagement.rate}</div>
              <div className="mt-1 text-xs text-gray-500">{stats.engagement.interactions} total interactions</div>
            </div>

            {/* User Participation */}
            <div className="bg-white p-5 sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-purple-500" />
                  <h4 className="text-sm font-medium text-gray-700">Active Users</h4>
                </div>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                  {Math.round((stats.users.active / stats.users.total) * 100)}%
                </span>
              </div>
              <div className="text-2xl font-semibold">
                {stats.users.active} <span className="text-sm font-normal text-gray-500">of {stats.users.total}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Active in last {statsFilter === 'day' ? '24 hours' : statsFilter}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewPage;

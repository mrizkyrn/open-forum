import React from 'react';

interface StatCardProps {
  title: string;
  value?: number | string;
  icon: React.ComponentType<any>;
  change: number;
  isLoading?: boolean;
  subtitle?: string;
}

const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} />;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, subtitle, isLoading = false }) => {
  const IconComponent = icon;
  const changeColor = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';

  return (
    <div
      className={`rounded-xl border-gray-100 bg-white bg-gradient-to-br transition-all duration-200 hover:shadow-sm`}
    >
      <div className="flex flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white">
            <IconComponent className="text-primary" size={20} />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-end">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {subtitle && <span className="ml-1 text-sm text-gray-500">{subtitle}</span>}
            </div>

            <div className="flex items-center">
              <span className={`inline-flex items-center text-sm font-medium ${changeColor}`}>
                <span className="text-md mr-1">{changeIcon}</span>
                {Math.abs(change)}%
              </span>
              <span className="ml-1.5 text-xs text-gray-500">from previous period</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatCard;

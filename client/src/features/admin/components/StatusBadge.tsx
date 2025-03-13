import { ReactNode } from 'react';

interface StatusBadgeProps {
  label: string;
  icon?: ReactNode;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ label, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[color]}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </span>
  );
};

export default StatusBadge;

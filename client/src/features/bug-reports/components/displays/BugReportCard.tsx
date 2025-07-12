import { format } from 'date-fns';
import { useState } from 'react';

import { BugPriority, BugPriorityDisplay, BugReport, BugStatus, BugStatusDisplay } from '../../types';
import BugReportDropdownAction from './BugReportDropdownAction';

interface BugReportCardProps {
  bugReport: BugReport;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const BugReportCard = ({ bugReport, showActions = false, onEdit, onDelete }: BugReportCardProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getStatusColor = (status: BugStatus) => {
    const colors = {
      [BugStatus.OPEN]: 'bg-red-100 text-red-800',
      [BugStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [BugStatus.RESOLVED]: 'bg-green-100 text-green-800',
      [BugStatus.CLOSED]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: BugPriority) => {
    const colors = {
      [BugPriority.LOW]: 'bg-blue-100 text-blue-800',
      [BugPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [BugPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [BugPriority.CRITICAL]: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  const isDescriptionLong = bugReport.description.length > 200;
  const displayDescription = showFullDescription
    ? bugReport.description
    : isDescriptionLong
      ? bugReport.description.substring(0, 200) + '...'
      : bugReport.description;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg font-semibold break-words hyphens-auto text-gray-900">
            {bugReport.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(bugReport.status)}`}
            >
              {BugStatusDisplay[bugReport.status].label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(bugReport.priority)}`}
            >
              {BugPriorityDisplay[bugReport.priority].label}
            </span>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <div className="flex-shrink-0 text-right">
            <p className="text-sm text-gray-500">{format(new Date(bugReport.createdAt), 'MMM dd, yyyy')}</p>
            {bugReport.assignedTo && (
              <p className="text-xs text-gray-400">Assigned to {bugReport.assignedTo.fullName}</p>
            )}
          </div>
          {showActions && (
            <div className="relative">
              <BugReportDropdownAction
                status={bugReport.status}
                onEdit={handleEdit}
                onDelete={handleDelete}
                authorId={bugReport.reporter?.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="min-w-0 overflow-hidden text-sm text-gray-600">
        <p className="break-words hyphens-auto whitespace-pre-wrap">{displayDescription}</p>
        {isDescriptionLong && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullDescription(!showFullDescription);
            }}
            className="mt-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {showFullDescription ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Resolution */}
      {bugReport.resolution && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-sm break-words hyphens-auto text-green-800">
            <span className="font-medium">Resolution:</span> {bugReport.resolution}
          </p>
        </div>
      )}
    </div>
  );
};

export default BugReportCard;

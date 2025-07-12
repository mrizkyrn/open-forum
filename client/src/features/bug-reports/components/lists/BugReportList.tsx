import FeedbackDisplay from '@/shared/components/feedback/FeedbackDisplay';
import LoadingIndicator from '@/shared/components/feedback/LoadingIndicator';
import { BugReport } from '@/features/bug-reports/types';
import BugReportCard from '../displays/BugReportCard';

interface BugReportListProps {
  bugReports: BugReport[];
  isLoading?: boolean;
  showActions?: boolean;
  onEdit?: (bugReport: BugReport) => void;
  onDelete?: (bugReport: BugReport) => void;
}

const BugReportList = ({
  bugReports,
  isLoading = false,
  showActions = false,
  onEdit,
  onDelete,
}: BugReportListProps) => {
  if (isLoading) {
    return <LoadingIndicator className="py-12" type="dots" fullWidth />;
  }

  if (bugReports.length === 0) {
    return (
      <FeedbackDisplay
        title="No Bug Reports Found"
        description="There are no bug reports matching your criteria."
        size="lg"
        variant="default"
      />
    );
  }

  return (
    <div className="space-y-4">
      {bugReports.map((bugReport) => (
        <BugReportCard
          key={bugReport.id}
          bugReport={bugReport}
          showActions={showActions}
          onEdit={onEdit ? () => onEdit(bugReport) : undefined}
          onDelete={onDelete ? () => onDelete(bugReport) : undefined}
        />
      ))}
    </div>
  );
};

export default BugReportList;

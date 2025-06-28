import MainButton from '@/shared/components/ui/buttons/MainButton';
import { Download, UserCheck } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showNewButton?: boolean;
  showExportButton?: boolean;
  onNewClick?: () => void;
  onExportClick?: () => void;
  newButtonText?: string;
  newButtonIcon?: ReactNode;
}

const PageHeader = ({
  title,
  description,
  actions,
  showNewButton = false,
  showExportButton = false,
  onNewClick,
  onExportClick,
  newButtonText = 'New',
  newButtonIcon = <UserCheck size={16} />,
}: PageHeaderProps) => {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        <h1 className="text-dark text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      {/* Actions section with pre-defined buttons or custom actions */}
      {(showNewButton || showExportButton || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {showNewButton && (
              <MainButton onClick={onNewClick} leftIcon={newButtonIcon}>
                {newButtonText}
              </MainButton>
            )}

            {showExportButton && (
              <MainButton onClick={onExportClick} variant="outline" leftIcon={<Download size={16} />}>
                Export
              </MainButton>
            )}

            {actions}
          </div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;

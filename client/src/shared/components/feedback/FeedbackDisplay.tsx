import { AlertTriangle, CheckCircle, Info, LucideIcon, XCircle } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type FeedbackVariant = 'default' | 'info' | 'warning' | 'error' | 'success';

export interface FeedbackAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  to?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  disabled?: boolean;
  isLoading?: boolean;
}

interface FeedbackDisplayProps {
  title: string;
  description?: string;
  variant?: FeedbackVariant;
  size?: 'sm' | 'md' | 'lg';
  actions?: FeedbackAction[];
  className?: string;
  compact?: boolean;
  hideIcon?: boolean;
  icon?: ReactNode;
  useBackground?: boolean;
}

const FeedbackDisplay = ({
  title,
  description,
  variant = 'default',
  size = 'md',
  actions = [],
  className = '',
  compact = false,
  hideIcon = false,
  icon,
  useBackground = false,
}: FeedbackDisplayProps) => {
  const defaultIcons: Record<FeedbackVariant, LucideIcon> = {
    default: Info,
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    success: CheckCircle,
  };

  const IconComponent = defaultIcons[variant];

  const variantStyles = {
    default: 'bg-white border border-gray-200',
    info: 'bg-blue-50 border border-blue-200',
    warning: 'bg-yellow-50 border border-yellow-200',
    error: 'bg-red-50 border border-red-200',
    success: 'bg-green-50 border border-green-200',
  };

  const iconContainerStyles = {
    default: 'bg-gray-100 text-gray-400',
    info: 'bg-blue-100 text-blue-500',
    warning: 'bg-yellow-100 text-yellow-500',
    error: 'bg-red-100 text-red-500',
    success: 'bg-green-100 text-green-500',
  };

  const titleStyles = {
    default: 'text-gray-900',
    info: 'text-blue-800',
    warning: 'text-yellow-800',
    error: 'text-red-800',
    success: 'text-green-800',
  };

  const descriptionStyles = {
    default: 'text-gray-500',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    success: 'text-green-600',
  };

  const actionStyles = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  const sizeStyles = {
    sm: compact ? 'p-4' : 'p-6',
    md: compact ? 'p-6' : 'p-8',
    lg: compact ? 'p-8' : 'p-12',
  };

  const iconSizeStyles = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const renderAction = (action: FeedbackAction, index: number) => {
    const ActionIcon = action.icon;
    const baseClasses = `flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      action.variant ? actionStyles[action.variant] : actionStyles.primary
    } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    // If it's a router link
    if (action.to) {
      return (
        <Link to={action.to} className={baseClasses} key={index}>
          {ActionIcon && <ActionIcon size={18} />}
          {action.label}
        </Link>
      );
    }

    // If it's a button
    return (
      <button
        key={index}
        onClick={action.onClick}
        disabled={action.disabled || action.isLoading}
        className={baseClasses}
      >
        {ActionIcon && <ActionIcon size={18} />}
        {action.label}
      </button>
    );
  };

  const getDefaultIconSize = () => {
    return size === 'sm' ? 20 : size === 'md' ? 24 : 32;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg text-center ${
        useBackground && variantStyles[variant]
      } ${sizeStyles[size]} ${className}`}
    >
      {!hideIcon && (
        <div
          className={`flex ${iconSizeStyles[size]} items-center justify-center rounded-full ${
            iconContainerStyles[variant]
          }`}
        >
          {icon ? (
            <div
              style={{ width: `${getDefaultIconSize()}px`, height: `${getDefaultIconSize()}px` }}
              className="flex items-center justify-center"
            >
              {icon}
            </div>
          ) : (
            <IconComponent size={getDefaultIconSize()} />
          )}
        </div>
      )}

      <h3 className={`${!hideIcon ? 'mt-4' : ''} text-lg font-medium ${titleStyles[variant]}`}>{title}</h3>

      {description && <p className={`mt-1 text-sm ${descriptionStyles[variant]}`}>{description}</p>}

      {actions.length > 0 && (
        <div className={`mt-6 flex flex-wrap gap-3 ${actions.length > 1 ? 'justify-center' : ''}`}>
          {actions.map(renderAction)}
        </div>
      )}
    </div>
  );
};

export default FeedbackDisplay;

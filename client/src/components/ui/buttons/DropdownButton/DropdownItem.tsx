import React from 'react';
import { Link } from 'react-router-dom';

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  to,
  icon,
  active = false,
  disabled = false,
  className = '',
}) => {
  const baseClasses = `
    flex w-full items-center px-3 py-1.5 text-xs transition-colors
    ${active ? 'bg-gray-50 text-gray-900' : 'text-gray-600'} 
    ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 hover:text-gray-900'} 
    ${className}
  `;

  const content = (
    <>
      {icon && <span className="mr-1.5 text-gray-500">{icon}</span>}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses} role="menuitem" tabIndex={-1}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseClasses} role="menuitem" tabIndex={-1}>
      {content}
    </button>
  );
};
import { ReactNode } from 'react';

interface AdminNavItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  collapsed: boolean;
  badgeCount?: number;
  onClick: () => void;
}

const AdminNavItem = ({ icon, label, isActive, collapsed, badgeCount = 0, onClick }: AdminNavItemProps) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={`group flex w-full cursor-pointer items-center rounded-md transition-all ${
          isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
        } ${collapsed ? 'relative justify-center p-3' : 'px-4 py-2.5'}`}
      >
        {collapsed ? (
          <span className={`${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'} relative`}>
            {icon}
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </span>
        ) : (
          <div className="ml-3 flex flex-1 items-center">
            <span className={`text-sm tracking-tight ${isActive ? 'text-primary' : ''}`}>{label}</span>
            {badgeCount > 0 && !collapsed && (
              <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </div>
        )}

        {/* Active indicator for collapsed state */}
        {isActive && collapsed && (
          <span className="bg-primary absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full"></span>
        )}
      </button>
    </li>
  );
};

export default AdminNavItem;

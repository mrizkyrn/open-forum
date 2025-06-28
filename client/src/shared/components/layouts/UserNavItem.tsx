import { JSX } from 'react';

export type NavItem = {
  name: string;
  path: string;
  icon: JSX.Element;
  badge?: boolean;
};

interface UserNavItemProps {
  item: NavItem;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
}

const UserNavItem = ({ item, isActive, unreadCount = 0, onClick }: UserNavItemProps) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={`group flex w-full items-center rounded-md py-3 transition-all sm:justify-center sm:px-2 lg:justify-start lg:px-4 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <span className={`${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'} relative`}>
          {item.icon}
          {item.badge && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
        <span className={`ml-3 text-sm tracking-tight ${isActive ? 'text-primary' : ''} hidden lg:block`}>
          {item.name}
        </span>
      </button>
    </li>
  );
};

export default UserNavItem;

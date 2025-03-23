import { LogOut } from 'lucide-react';
import { JSX } from 'react';
import Logo from './Logo';
import UserAvatar from './UserAvatar';

// Navigation item type
export type NavItem = {
  name: string;
  path: string;
  icon: JSX.Element;
  badge?: boolean;
};

// Props for the Navigation Item
interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
}

// Navigation Item Component
const NavigationItem = ({ item, isActive, unreadCount = 0, onClick }: NavigationItemProps) => {
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

// Props for the Left Sidebar
interface LeftSidebarProps {
  navItems: NavItem[];
  isNavItemActive: (path: string) => boolean;
  unreadCount: number;
  user: any;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const LeftSidebar = ({ navItems, isNavItemActive, unreadCount, user, onNavigate, onLogout }: LeftSidebarProps) => {
  return (
    <div className="sticky top-0 h-screen overflow-y-auto border-r border-gray-200 bg-white transition-all duration-200 md:w-16 lg:w-64">
      <div className="flex items-center p-4 md:justify-center lg:justify-start">
        <div className="hidden lg:block">
          <Logo />
        </div>
        <div className="flex justify-center lg:hidden">
          <Logo collapsed />
        </div>
      </div>
      <nav className="mt-4 flex h-[calc(100vh-100px)] flex-col justify-between px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <NavigationItem
              key={item.name}
              item={item}
              isActive={isNavItemActive(item.path)}
              unreadCount={unreadCount}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </ul>

        {/* User & logout section */}
        <div className="mt-auto border-t border-gray-100 pt-6">
          <div className="flex cursor-pointer items-center rounded-md hover:bg-gray-50 md:justify-center lg:justify-start lg:px-3">
            <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="sm" />
            <div className="ml-2 hidden lg:block">
              <p className="line-clamp-1 text-sm font-medium text-gray-800">{user?.fullName || 'User'}</p>
              <p className="line-clamp-1 text-xs text-gray-500">@{user?.username || 'username'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-2 flex w-full cursor-pointer items-center rounded-md py-3 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 md:justify-center md:px-2 lg:justify-start lg:px-4"
          >
            <LogOut size={16} strokeWidth={2} className="lg:mr-2" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default LeftSidebar;

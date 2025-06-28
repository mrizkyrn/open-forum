import { LogOut, Plus } from 'lucide-react';

import UserAvatar from '@/features/users/components/UserAvatar';
import Logo from './Logo';
import UserNavItem, { NavItem } from './UserNavItem';

interface LeftSidebarProps {
  navItems: NavItem[];
  isNavItemActive: (path: string) => boolean;
  unreadCount: number;
  user: any;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onCreateDiscussion: () => void;
}

const LeftSidebar = ({
  navItems,
  isNavItemActive,
  unreadCount,
  user,
  onNavigate,
  onLogout,
  onCreateDiscussion,
}: LeftSidebarProps) => {
  return (
    <div className="sticky top-0 h-screen overflow-y-auto border-r border-gray-200 bg-white transition-all duration-200 sm:w-16 lg:w-72">
      <div className="flex items-center p-4 sm:justify-center lg:justify-start">
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
            <UserNavItem
              key={item.name}
              item={item}
              isActive={isNavItemActive(item.path)}
              unreadCount={unreadCount}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </ul>

        {/* Create Discussion Button */}
        <div className="mt-5 px-2">
          <button
            onClick={onCreateDiscussion}
            className="bg-primary flex items-center justify-center rounded-full px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none sm:mx-auto sm:h-10 sm:w-10 sm:p-0 lg:h-auto lg:w-full lg:px-4 lg:py-2.5"
          >
            <Plus size={16} className="sm:h-5 sm:w-5 lg:mr-2 lg:h-4 lg:w-4" />
            <span className="sm:hidden lg:inline">Create Discussion</span>
          </button>
        </div>

        {/* User Profile & Logout */}
        <div className="mt-auto border-t border-gray-100 pt-6">
          <div className="flex cursor-pointer items-center rounded-md hover:bg-gray-50 sm:justify-center lg:justify-start lg:px-3">
            <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="sm" />
            <div className="ml-2 hidden lg:block">
              <p className="line-clamp-1 text-sm font-medium text-gray-800">{user?.fullName || 'User'}</p>
              <p className="line-clamp-1 text-xs text-gray-500">@{user?.username || 'username'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-2 flex w-full cursor-pointer items-center rounded-md py-3 text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 sm:justify-center sm:px-2 lg:justify-start lg:px-4"
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

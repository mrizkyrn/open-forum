import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { ReactNode } from 'react';

import AdminNavItem from './AdminNavItem';

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  badgeCount?: number;
}

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  menuItems: MenuItem[];
  currentPath: string;
  username?: string;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

const AdminSidebar = ({
  collapsed,
  setCollapsed,
  menuItems,
  currentPath,
  username,
  onLogout,
  onNavigate,
}: AdminSidebarProps) => {
  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hover:text-primary absolute top-16 -right-3 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors focus:outline-none"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div
        className={`flex h-16 items-center px-4 ${collapsed ? 'justify-center' : 'justify-between'} border-b border-gray-50`}
      >
        {collapsed ? (
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
            <span className="text-primary font-bold">U</span>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
              <span className="text-primary font-bold">U</span>
            </div>
            <h1 className="ml-2 text-base font-semibold tracking-tight text-gray-800">UPNVJ Admin</h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <AdminNavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={currentPath === item.path}
              collapsed={collapsed}
              badgeCount={item.badgeCount}
              onClick={() => onNavigate(item.path)}
            />
          ))}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className={`border-t border-gray-50 p-4 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && (
          <div className="mb-4">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-medium text-gray-800">{username || 'Admin'}</p>
          </div>
        )}
        <button
          onClick={onLogout}
          className={`flex cursor-pointer items-center rounded-md text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 ${
            collapsed ? 'justify-center p-3' : 'w-full px-4 py-2'
          }`}
        >
          <LogOut size={18} strokeWidth={2} className={collapsed ? '' : 'mr-2'} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

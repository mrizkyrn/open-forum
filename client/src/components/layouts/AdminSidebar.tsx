import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { FC, ReactNode } from 'react';

interface AdminNavItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  collapsed: boolean;
  badgeCount?: number;
  onClick: () => void;
}

const AdminNavItem: FC<AdminNavItemProps> = ({ icon, label, isActive, collapsed, badgeCount = 0, onClick }) => {
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

        {isActive && collapsed && (
          <span className="bg-primary absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full"></span>
        )}
      </button>
    </li>
  );
};

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

const AdminSidebar: FC<AdminSidebarProps> = ({
  collapsed,
  setCollapsed,
  menuItems,
  currentPath,
  username,
  onLogout,
  onNavigate,
}) => {
  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out`}
    >
      {/* Collapse toggle button */}
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

      {/* Nav links */}
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

      {/* User & logout section */}
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
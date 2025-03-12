import { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  FolderKanban,
  Flag,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/features/users/types';

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check admin permission and redirect if not admin
  useEffect(() => {
    if (!user?.role || user.role !== UserRole.ADMIN) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/admin' },
    { icon: <Users size={18} />, label: 'Users', path: '/admin/users' },
    { icon: <MessagesSquare size={18} />, label: 'Discussions', path: '/admin/discussions' },
    { icon: <FolderKanban size={18} />, label: 'Spaces', path: '/admin/spaces' },
    { icon: <Flag size={18} />, label: 'Reports', path: '/admin/reports' },
    { icon: <BarChart2 size={18} />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={18} />, label: 'Settings', path: '/admin/settings' },
  ];

  // If authentication is still being checked, show nothing
  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } relative flex h-full flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out`}
      >
        {/* Collapse toggle button - Positioned on the edge */}
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
          {!collapsed && (
            <div className="flex items-center">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
                <span className="text-primary font-bold">U</span>
              </div>
              <h1 className="ml-2 text-base font-semibold tracking-tight text-gray-800">UPNVJ Admin</h1>
            </div>
          )}
          {collapsed && (
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
              <span className="text-primary font-bold">U</span>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`group flex w-full cursor-pointer items-center rounded-md transition-all ${
                      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
                    } ${collapsed ? 'justify-center p-3' : 'px-4 py-2.5'}`}
                  >
                    <span className={`${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className={`ml-3 text-sm tracking-tight ${isActive ? 'text-primary' : ''}`}>
                        {item.label}
                      </span>
                    )}
                    {isActive && collapsed && (
                      <span className="bg-primary absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full"></span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User & logout section */}
        <div className={`border-t border-gray-50 p-4 ${collapsed ? 'flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="mb-4">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="text-sm font-medium text-gray-800">{user.username || 'Admin'}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex cursor-pointer items-center rounded-md text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 ${
              collapsed ? 'justify-center p-3' : 'w-full px-4 py-2'
            }`}
          >
            <LogOut size={18} strokeWidth={2} className={collapsed ? '' : 'mr-2'} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Max-width container for content */}
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

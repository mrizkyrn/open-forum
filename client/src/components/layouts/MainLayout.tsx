import { useAuth } from '@/features/auth/hooks/useAuth';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home, Search, Layers, Bell, User, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { notificationApi } from '@/features/notifications/services/notificationApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const MainLayout = () => {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const [newNotificationReceived, setNewNotificationReceived] = useState(false);

  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
  });

  const unreadCount = unreadCountData?.count || 0;

  // Listen for new notifications
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    // Update the notification handler in MainLayout.tsx
    const handleNewNotification = (notification: any) => {
      console.log('New notification received:', notification);

      // Update the unread count
      refetchUnreadCount();

      // Show visual indicator
      setNewNotificationReceived(true);

      // IMPORTANT: Invalidate the notifications query so it refetches when navigating to the page
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    // Listen for notification events
    socket.on('newNotification', handleNewNotification);

    // Cleanup
    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, isConnected, user?.id, refetchUnreadCount, location.pathname, queryClient]);

  useEffect(() => {
    if (location.pathname === '/notifications') {
      setNewNotificationReceived(false);
    }
  }, [location.pathname]);

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  const isNavItemActive = (itemPath: string) => {
    // Get the current URL search params
    const searchParams = new URLSearchParams(location.search);
    const source = searchParams.get('source');

    // Exact match
    if (location.pathname === itemPath) {
      return true;
    }

    // For discussion pages, use the source param if available
    if (location.pathname.startsWith('/discussions/')) {
      if (source === 'spaces' && itemPath === '/spaces') return true;
      if (source === 'search' && itemPath === '/search') return true;
      if (!source && itemPath === '/') return true;
      return false;
    }

    // For other paths, check if current path starts with the item path
    if (itemPath !== '/' && location.pathname.startsWith(itemPath)) {
      return true;
    }

    // Home is active for regular discussions with no source
    if (itemPath === '/' && location.pathname.startsWith('/discussions') && !source) {
      return true;
    }

    return false;
  };

  const onLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Spaces', path: '/spaces', icon: <Layers size={18} /> },
    { name: 'Search', path: '/search', icon: <Search size={18} /> },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: <Bell size={18} />,
      badge: unreadCount > 0 || newNotificationReceived,
    },
    { name: 'Profile', path: '/profile', icon: <User size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <div
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } relative hidden h-full flex-col border-r border-gray-100 bg-white transition-all duration-300 ease-in-out md:flex`}
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
          {!collapsed && (
            <div className="flex items-center">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
                <span className="text-primary font-bold">U</span>
              </div>
              <h1 className="ml-2 text-base font-semibold tracking-tight text-gray-800">UPNVJ Forum</h1>
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
            {navItems.map((item) => {
              const isActive = isNavItemActive(item.path);
              return (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`group flex w-full cursor-pointer items-center rounded-md transition-all ${
                      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
                    } ${collapsed ? 'relative justify-center p-3' : 'px-4 py-2.5'}`}
                  >
                    <span
                      className={`${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'} relative`}
                    >
                      {item.icon}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : ''}
                        </span>
                      )}
                    </span>
                    {!collapsed && (
                      <span
                        className={`ml-3 text-sm tracking-tight ${isActive ? 'text-primary' : ''} flex items-center`}
                      >
                        {item.name}
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
        <div className={`border-t border-gray-50 p-4 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          {!collapsed ? (
            <div className="mb-3 flex items-center">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </div>
              <div className="ml-2">
                <p className="truncate text-sm font-medium text-gray-800">{user?.fullName || 'User'}</p>
                <p className="truncate text-xs text-gray-500">@{user?.username || 'username'}</p>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User size={16} className="text-gray-500" />
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            className={`flex cursor-pointer items-center rounded-md text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 ${
              collapsed ? 'justify-center p-2' : 'w-full px-3 py-2'
            }`}
          >
            <LogOut size={16} strokeWidth={2} className={collapsed ? '' : 'mr-2'} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 md:hidden">
        <div className="flex items-center">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
            <span className="text-primary font-bold">U</span>
          </div>
          <h1 className="ml-2 text-base font-semibold tracking-tight text-gray-800">UPNVJ Forum</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-500">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Menu (optional, for user profile/logout) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-0 right-0 h-full w-64 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className="text-gray-500" />
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-800">{user?.fullName || 'User'}</p>
                <p className="text-sm text-gray-500">@{user?.username || 'username'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex w-full items-center rounded-md px-4 py-2 text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} className="mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-gray-100 bg-white md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.path);
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className="relative flex h-full flex-1 flex-col items-center justify-center"
              >
                <div className={`${isActive ? 'text-primary' : 'text-gray-500'} relative`}>
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : ''}
                    </span>
                  )}
                </div>
                <span className={`mt-1 text-xs ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-3xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

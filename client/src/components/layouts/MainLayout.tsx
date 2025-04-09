import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreateDiscussionModal } from '@/features/discussions/components';
import { notificationApi } from '@/features/notifications/services/notificationApi';
import { useSocket } from '@/hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Bookmark, Home, Layers, LogOut, Menu, Plus, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import UserAvatar from '../../features/users/components/UserAvatar';
import LeftSidebar, { NavItem } from './LeftSidebar';
import Logo from './Logo';
import RightSidebar from './RightSidebar';

const MobileNavItem = ({
  item,
  isActive,
  unreadCount = 0,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  unreadCount?: number;
  onClick: () => void;
}) => {
  return (
    <button onClick={onClick} className="relative flex h-full flex-1 flex-col items-center justify-center">
      <div className={`${isActive ? 'text-primary' : 'text-gray-500'} relative`}>
        {item.icon}
        {item.badge && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      <span className={`mt-1 text-xs ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>{item.name}</span>
    </button>
  );
};

const MobileMenuItem = ({
  icon,
  label,
  onClick,
  isDanger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-md px-4 py-3 text-sm transition-colors ${
        isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={`mr-3 ${isDanger ? 'text-red-500' : 'text-gray-500'}`}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const MainLayout = () => {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNotificationReceived, setNewNotificationReceived] = useState(false);

  // Get unread notification count
  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
  });

  const unreadCount = unreadCountData?.count || 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isNavItemActive = useCallback(
    (itemPath: string) => {
      const pathMappings = {
        '/profile': '/profile',
        '/bookmarks': '/bookmarks',
        '/spaces': '/spaces',
        '/explore': '/explore',
        '/search': '/explore',
        '/notifications': '/notifications',
      };

      // Check if the current path matches the item path directly
      if (location.pathname === itemPath) {
        return true;
      }

      // For other nested pages, find their parent item
      for (const [pathPrefix, navItem] of Object.entries(pathMappings)) {
        if (location.pathname.startsWith(pathPrefix) && navItem === itemPath) {
          return true;
        }
      }

      return false;
    },
    [location.pathname],
  );

  // Handle logout
  const onLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigate to a path and close mobile menu
  const navigateAndClose = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Navigation items (excluding Profile and Bookmarks for mobile)
  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Spaces', path: '/spaces', icon: <Layers size={20} /> },
    { name: 'Explore', path: '/explore', icon: <Search size={20} /> },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: <Bell size={20} />,
      badge: unreadCount > 0 || newNotificationReceived,
    },
  ];

  // Full navigation items for desktop
  const desktopNavItems: NavItem[] = [
    ...navItems,
    {
      name: 'Profile',
      path: user?.username ? `/profile/${user.username}` : '/profile',
      icon: <User size={20} />,
    },
    { name: 'Bookmarks', path: '/bookmarks', icon: <Bookmark size={20} /> },
  ];

  // Navigate to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Reset notification indicator when visiting notifications page
  useEffect(() => {
    if (location.pathname === '/notifications') {
      setNewNotificationReceived(false);
    }
  }, [location.pathname]);

  // Listen for new notifications
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    const handleNewNotification = (notification: any) => {
      console.log('New notification received:', notification);
      refetchUnreadCount();
      setNewNotificationReceived(true);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (notification.entityType === 'report' && notification.data.isContentDeleted) {
        if (notification.data.targetType === 'discussion') {
          queryClient.invalidateQueries({ queryKey: ['discussion', notification.data.targetId] });
        }
      }
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket, isConnected, user?.id, refetchUnreadCount, queryClient]);

  return (
    <div className="text-dark min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 sm:hidden">
        <Logo />
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-500">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-in-out sm:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 flex h-full w-72 flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header with Close Button */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            {/* Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="border-b border-gray-100 p-4">
            <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="md" />
            <div className="mt-2 flex flex-col items-start">
              <p className="font-medium text-gray-800">{user?.fullName || 'User'}</p>
              <p className="text-sm text-gray-500">@{user?.username || 'username'}</p>
            </div>
          </div>

          {/* Menu Items - Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <MobileMenuItem
              icon={<User size={18} />}
              label="Profile"
              onClick={() => navigateAndClose(user?.username ? `/profile/${user.username}` : '/profile')}
            />
            <MobileMenuItem
              icon={<Bookmark size={18} />}
              label="Bookmarks"
              onClick={() => navigateAndClose('/bookmarks')}
            />

            {/* Create Discussion */}
            <div className="mt-4 px-4 py-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="bg-primary flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={16} className="mr-2" />
                Create Discussion
              </button>
            </div>
          </div>

          {/* Logout placed at the bottom with margin-top auto */}
          <div className="mt-auto border-t border-gray-100">
            <MobileMenuItem icon={<LogOut size={18} />} label="Logout" onClick={onLogout} isDanger />
          </div>
        </div>
      </div>

      {/* Three-column Layout with fixed-width sidebar */}
      <div className="mx-auto flex max-w-7xl">
        {/* Left Sidebar */}
        <div className="hidden flex-shrink-0 sm:block">
          <LeftSidebar
            navItems={desktopNavItems}
            isNavItemActive={isNavItemActive}
            unreadCount={unreadCount}
            user={user}
            onNavigate={(path) => navigate(path)}
            onLogout={onLogout}
            onCreateDiscussion={() => setIsCreateModalOpen(true)}
          />
        </div>

        {/* Main Content & Right Sidebar */}
        <div className="flex-grow">
          <div className="grid grid-cols-10">
            {/* Middle Column: Main Content */}
            <div className="bg-light col-span-10 min-h-screen py-14 sm:py-0 md:col-span-6">
              <div className="p-4">
                <Outlet />
              </div>
            </div>

            {/* Right Column: Trending & Suggestions */}
            <div className="hidden md:col-span-4 md:block">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile - Now with only 4 items */}
      <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-gray-100 bg-white sm:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.name}
              item={item}
              isActive={isNavItemActive(item.path)}
              unreadCount={unreadCount}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>

      {/* Create Discussion Modal */}
      <CreateDiscussionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
};

export default MainLayout;

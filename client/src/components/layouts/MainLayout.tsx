import { useAuth } from '@/features/auth/hooks/useAuth';
import { notificationApi } from '@/features/notifications/services/notificationApi';
import { useSocket } from '@/hooks/useSocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Bookmark, Home, Layers, LogOut, Menu, Search, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LeftSidebar, { NavItem } from './LeftSidebar';
import Logo from './Logo';
import RightSidebar from './RightSidebar';
import UserAvatar from './UserAvatar';
import { CreateDiscussionModal } from '@/features/discussions/components';

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

  // Navigation item active state check
  const isNavItemActive = useCallback(
    (itemPath: string) => {
      const searchParams = new URLSearchParams(location.search);
      const source = searchParams.get('source');

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
    },
    [location.pathname, location.search],
  );

  // Handle logout
  const onLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation items
  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: <Home size={20} /> },
    { name: 'Spaces', path: '/spaces', icon: <Layers size={20} /> },
    { name: 'Search', path: '/search', icon: <Search size={20} /> },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: <Bell size={20} />,
      badge: unreadCount > 0 || newNotificationReceived,
    },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
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
    <div className="text-dark min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-10 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 sm:hidden">
        <Logo />
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-500">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-0 right-0 h-full w-64 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center">
              <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="md" />
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

      {/* Three-column Layout with fixed-width sidebar */}
      <div className="mx-auto flex max-w-7xl pt-14 sm:pt-0">
        {/* Left Sidebar */}
        <div className="hidden flex-shrink-0 sm:block">
          <LeftSidebar
            navItems={navItems}
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
          <div className="grid grid-cols-12">
            {/* Middle Column: Main Content */}
            <div className="col-span-12 min-h-screen bg-white md:col-span-8">
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

      {/* Bottom Navigation for Mobile */}
      <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-gray-100 bg-white sm:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.slice(0, 5).map((item) => (
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

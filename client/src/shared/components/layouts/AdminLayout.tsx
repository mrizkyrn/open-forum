import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Building, Flag, FolderKanban, LayoutDashboard, MessagesSquare, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { reportApi } from '@/features/reports/services';
import { UserRole } from '@/features/users/types';
import { useSocket } from '@/shared/hooks/useSocket';
import AdminSidebar from './AdminSidebar';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badgeCount?: number;
}

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: reportStats } = useQuery({
    queryKey: ['reportStats'],
    queryFn: reportApi.getReportStats,
    enabled: isAuthenticated && user?.role === UserRole.ADMIN,
  });

  const menuItems: MenuItem[] = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/admin' },
    { icon: <Users size={18} />, label: 'Users', path: '/admin/users' },
    { icon: <Building size={20} />, label: 'Faculties', path: '/admin/faculties' },
    { icon: <BookOpen size={20} />, label: 'Study Programs', path: '/admin/study-programs' },
    { icon: <MessagesSquare size={18} />, label: 'Discussions', path: '/admin/discussions' },
    { icon: <FolderKanban size={18} />, label: 'Spaces', path: '/admin/spaces' },
    { icon: <Flag size={18} />, label: 'Reports', path: '/admin/reports', badgeCount: reportStats?.pending },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Scroll to top on path change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Check admin permission and redirect if not admin
  useEffect(() => {
    if (!isLoading && user?.role !== UserRole.ADMIN) {
      navigate('/', { replace: true });
    }
  }, [user, navigate, isLoading]);

  // Listen for new reports via socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewReport = () => {
      queryClient.invalidateQueries({ queryKey: ['pendingReports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    };

    socket.on('newReport', handleNewReport);

    return () => {
      socket.off('newReport', handleNewReport);
    };
  }, [socket, isConnected, queryClient]);

  if (!user) return null;

  return (
    <div className="text-dark flex h-screen bg-gray-50">
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        menuItems={menuItems}
        currentPath={location.pathname}
        username={user.username}
        onLogout={handleLogout}
        onNavigate={handleNavigation}
      />

      <div ref={mainContentRef} className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

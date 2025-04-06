import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/features/users/types';
import {
  BarChart2,
  BookOpen,
  Building,
  Flag,
  FolderKanban,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);

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

  // Admin menu items
  const menuItems: MenuItem[] = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/admin' },
    { icon: <Users size={18} />, label: 'Users', path: '/admin/users' },
    { icon: <Building size={20} />, label: 'Faculties', path: '/admin/faculties' },
    { icon: <BookOpen size={20} />, label: 'Study Programs', path: '/admin/study-programs' },
    { icon: <MessagesSquare size={18} />, label: 'Discussions', path: '/admin/discussions' },
    { icon: <FolderKanban size={18} />, label: 'Spaces', path: '/admin/spaces' },
    { icon: <Flag size={18} />, label: 'Reports', path: '/admin/reports' },
    { icon: <BarChart2 size={18} />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={18} />, label: 'Settings', path: '/admin/settings' },
  ];

  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // If authentication is still being checked, show nothing
  if (!user) return null;

  return (
    <div className="text-dark flex h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        menuItems={menuItems}
        currentPath={location.pathname}
        username={user.username}
        onLogout={handleLogout}
        onNavigate={handleNavigation}
      />

      {/* Main content */}
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

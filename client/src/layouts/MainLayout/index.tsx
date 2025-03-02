import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const MainLayout = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  const onLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="font-poppins min-h-screen w-full bg-gray-200 pt-10 pb-28 sm:px-20 sm:pb-10 lg:px-64">
      {/* logout button */}
      <button onClick={onLogout} className="absolute top-5 right-5 rounded-md bg-red-500 px-3 py-1 text-white">
        Logout
      </button>
      <Outlet />
    </div>
  );
};

export default MainLayout;

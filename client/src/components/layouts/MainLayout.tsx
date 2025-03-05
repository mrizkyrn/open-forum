import { useAuth } from '@/features/auth/hooks/useAuth';
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
    <div className="font-poppins min-h-screen w-full bg-light sm:px-20 lg:px-64 py-5">
      {/* logout button */}
      <button onClick={onLogout} className="absolute top-5 right-5 rounded-md bg-red-500 px-3 py-1 text-white">
        Logout
      </button>
      <Outlet />
    </div>
  );
};

export default MainLayout;

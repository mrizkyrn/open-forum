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
    <div className="font-poppins bg-light min-h-screen w-full py-5">
      <div className="container mx-auto flex max-w-xl items-start gap-2 px-4">
        <Outlet />
      </div>
      <button onClick={onLogout} className="absolute top-5 right-5 rounded-md bg-red-500 px-3 py-1 text-white">
        Logout
      </button>
    </div>
  );
};

export default MainLayout;

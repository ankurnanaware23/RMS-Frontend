import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const PublicRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return !isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to={isAdmin ? "/dashboard" : "/menu"} replace />
  );
};

export default PublicRoute;

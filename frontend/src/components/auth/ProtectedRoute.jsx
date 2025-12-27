import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

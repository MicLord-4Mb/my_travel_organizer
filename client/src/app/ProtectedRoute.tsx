import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@app/hooks';
import { selectIsAuthenticated } from '@entities/session';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route guard component that restricts access to authenticated users.
 * Redirects unauthenticated users to `/login` preserving the attempted destination in state.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return <Component />;
};

export default ProtectedRoute;

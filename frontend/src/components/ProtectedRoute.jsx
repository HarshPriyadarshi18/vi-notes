import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService.js';

export const ProtectedRoute = ({ component: Component }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return <Component />;
};

export default ProtectedRoute;

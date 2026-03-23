import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Navbar } from '../common/Navbar';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};
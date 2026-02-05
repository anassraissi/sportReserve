import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/reservation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Check localStorage as primary source of truth
  const storedUser = localStorage.getItem('currentUser');
  const token = localStorage.getItem('token');
  const hasStoredUser = storedUser && token;
  
  // If we have stored user, we're authenticated (even if state hasn't updated yet)
  if (hasStoredUser) {
    // Check role if required
    if (requiredRole) {
      try {
        const userData = JSON.parse(storedUser!);
        const roleHierarchy: Record<UserRole, number> = {
          user: 1,
          admin: 2,
        };
        if (roleHierarchy[userData.role as UserRole] < roleHierarchy[requiredRole]) {
          return <Navigate to="/dashboard" replace />;
        }
      } catch {
        // If parsing fails, continue anyway
      }
    }
    return <>{children}</>;
  }

  // Show loading state only if we're actually loading and have no stored data
  if (isLoading && !hasStoredUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No stored user and not loading - redirect to login
  if (!isAuthenticated && !user && !hasStoredUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      admin: 2,
    };

    if (roleHierarchy[user!.role] < roleHierarchy[requiredRole]) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

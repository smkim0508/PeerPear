'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loginWithCAS } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectToLogin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  fallback = <div>Loading...</div>, 
  redirectToLogin = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectToLogin) {
      // Redirect to CAS login with current page as return URL
      loginWithCAS(window.location.href);
    }
  }, [isAuthenticated, isLoading, redirectToLogin]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Checking authentication...</p>
      </div>
    </div>;
  }

  // Show fallback if not authenticated and not redirecting
  if (!isAuthenticated && !redirectToLogin) {
    return <>{fallback}</>;
  }

  // Show children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show loading while redirect is happening
  return <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-2 text-gray-600">Redirecting to login...</p>
    </div>
  </div>;
}
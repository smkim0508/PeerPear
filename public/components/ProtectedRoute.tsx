"use client";

import { useEffect, ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginWithCAS } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectToLogin?: boolean;
}

export default function ProtectedRoute({
  children,
  fallback = (
    <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  ),
  redirectToLogin = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileChecked, setProfileChecked] = useState(false);
  const storedUserType =
    typeof window !== "undefined"
      ? (localStorage.getItem("userType") as
          | "student"
          | "organization"
          | null)
      : null;
  const inferredUserType =
    user?.userType || storedUserType || ("student" as const);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectToLogin) {
      // Redirect to CAS login with current page as return URL
      loginWithCAS(window.location.href);
    }
  }, [isAuthenticated, isLoading, redirectToLogin]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setProfileChecked(true);
      return;
    }

    const isProfileRoute = pathname?.startsWith(`/${inferredUserType}/profile`);

    if (isProfileRoute) {
      setProfileChecked(true);
      return;
    }

    setProfileChecked(true);
  }, [
    inferredUserType,
    isAuthenticated,
    isLoading,
    pathname,
    router,
    user?.organizationProfileComplete,
    user?.profileComplete,
    user?.userType,
  ]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && !profileChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Preparing your workspace...</p>
        </div>
      </div>
    );
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
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}

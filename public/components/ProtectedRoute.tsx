"use client";

import { useEffect, ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginWithCAS, verifyOrganizationAccess } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectToLogin?: boolean;
  requiredRole?: "student" | "organization";
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
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileChecked, setProfileChecked] = useState(false);
  const [orgVerificationChecked, setOrgVerificationChecked] = useState(false);
  const storedUserType =
    typeof window !== "undefined"
      ? (localStorage.getItem("userType") as "student" | "organization" | null)
      : null;
  const inferredUserType = storedUserType;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectToLogin) {
      // Redirect to CAS login with current page as return URL
      loginWithCAS(window.location.href);
    }
  }, [isAuthenticated, isLoading, redirectToLogin]);

  // Check role-based access
  useEffect(() => {
    if (isAuthenticated && requiredRole && storedUserType) {
      if (storedUserType !== requiredRole) {
        // User is logged in but accessing wrong role route
        // Redirect to their correct dashboard
        router.push(`/${storedUserType}`);
        return;
      }
    }
  }, [isAuthenticated, requiredRole, storedUserType, router]);

  // Verify organization admin access for organization routes
  useEffect(() => {
    async function verifyOrgAccess() {
      // If this is not an organization route, mark verification as complete
      if (requiredRole !== "organization") {
        setOrgVerificationChecked(true);
        return;
      }

      // If not authenticated or already checked, don't verify
      if (!isAuthenticated || orgVerificationChecked) {
        return;
      }

      try {
        const verification = await verifyOrganizationAccess();
        
        if (!verification.authorized) {
          // User is not an org admin, log them out and redirect
          localStorage.setItem("authError", verification.error || "You are not authorized to access organization features.");
          await logout();
          return;
        }
        
        setOrgVerificationChecked(true);
      } catch (error) {
        console.error("Error verifying organization access:", error);
        localStorage.setItem("authError", "Unable to verify organization access. Please try again.");
        await logout();
      }
    }

    verifyOrgAccess();
  }, [isAuthenticated, requiredRole, orgVerificationChecked, logout]);

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

  // Show loading while verifying organization access
  if (isAuthenticated && requiredRole === "organization" && !orgVerificationChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verifying organization access...</p>
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

  // Show children if authenticated and has correct role (or no role required)
  if (isAuthenticated) {
    // If a specific role is required, check if user has the correct role
    if (requiredRole && storedUserType && storedUserType !== requiredRole) {
      // Show loading while redirect is happening
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      );
    }
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

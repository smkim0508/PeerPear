/**
 * Authentication utilities for communicating with Flask backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface User {
  id?: number;
  username: string;
  user_info: any;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string | null;
  profileComplete?: boolean;
  organizationId?: number;
  organizationProfileComplete?: boolean;
}

export interface AuthStatus {
  authenticated: boolean;
  username: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  username: string;
  user_info: any;
  user_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string | null;
  user_type?: "student" | "organization";
  profile_complete?: boolean;
  organization_id?: number;
  organization_profile_complete?: boolean;
}

/**
 * Check authentication status
 */
export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    console.log("Checking auth status from", API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      credentials: "include", // Include cookies for session
    });
    
    if (response.ok) {
      console.log("Auth status response received");
      return await response.json();
    }
    
    console.log("Auth status response not ok");
    return { authenticated: false, username: null };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false, username: null };
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      credentials: "include",
    });
    
    if (response.ok) {
      const data: AuthResponse = await response.json();
      return {
        id: data.user_id,
        username: data.username,
        user_info: data.user_info,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phoneNumber: data.phone_number ?? null,
        profileComplete: data.profile_complete,
        organizationId: data.organization_id,
        organizationProfileComplete: data.organization_profile_complete,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Initiate CAS login by redirecting to the backend auth endpoint
 */
export function loginWithCAS(redirectUrl?: string): void {
  // Use current page as default redirect URL
  const currentUrl = window.location.href;
  const targetRedirectUrl = redirectUrl || currentUrl;
  
  // Redirect to Flask backend which will handle CAS authentication
  // and then redirect back to the specified URL
  const loginUrl = `${API_BASE_URL}/auth/login?redirect_url=${encodeURIComponent(
    targetRedirectUrl
  )}`;
  window.location.href = loginUrl;
}

/**
 * Logout from the application
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "GET",
      credentials: "include",
    });
    
    // Reload the page to clear any cached state
    window.location.reload();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

/**
 * Logout from CAS (full logout)
 */
export function logoutFromCAS(): void {
  window.location.href = `${API_BASE_URL}/auth/logout-cas`;
}

/**
 * Handle redirects after CAS authentication
 * This should be called on pages that might receive CAS redirects
 */
export function handleCASRedirect(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const ticket = urlParams.get('ticket');
  
  if (ticket) {
    // Remove the ticket parameter from URL for cleaner experience
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('ticket');
    window.history.replaceState({}, '', newUrl.toString());
  }
}

/**
 * Verify if the current user can access organization features
 */
export async function verifyOrganizationAccess(): Promise<{authorized: boolean, error?: string, organization_id?: number}> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-organization-access`, {
      credentials: "include",
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 403) {
      const errorData = await response.json();
      return { authorized: false, error: errorData.error };
    } else {
      return { authorized: false, error: "Unable to verify organization access" };
    }
  } catch (error) {
    console.error('Error verifying organization access:', error);
    return { authorized: false, error: "Unable to verify organization access" };
  }
}
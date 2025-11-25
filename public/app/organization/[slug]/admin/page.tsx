"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Squiggle } from "@/components/ui/Squiggle";
import { Building2, Edit3, Save, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import PearButton from "@/components/PearButton";

interface AdminPageProps {
  params: Promise<{ slug: string }>;
}

interface Admin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  owner: boolean;
}

export default function AdminPage({ params }: AdminPageProps) {
  const { slug } = use(params);
  const organizationId = parseInt(slug);
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const owners = admins.filter((a) => a.owner);
  const regularAdmins = admins.filter((a) => !a.owner);

  const [message, setMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Validate organization admin access *** CHANGE TO OWNER ACCESS LATER***
  const validateAdminAccess = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/organization/validate-admin/${organizationId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        setIsAuthorized(true);
      } else if (response.status === 401) {
        setMessage(
          "Please log in to access this organization profile. Redirecting..."
        );
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      } else if (response.status === 403) {
        setMessage(
          "You do not have admin access to this organization. Redirecting..."
        );
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      } else {
        setMessage("Failed to validate organization access. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      }
    } catch (err) {
      console.error("Error validating admin access:", err);
      setMessage(
        "Failed to validate organization access. Please check your connection. Redirecting..."
      );
      setIsAuthorized(false);
      setTimeout(() => router.push("/organization"), 2000);
    }
  };

  const validateOwnerAccess = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/organization/validate-owner/${organizationId}`,
        { credentials: "include" }
      );

      if (response.ok) {
        setIsAuthorized(true);
      } else if (response.status === 401) {
        setMessage("Please log in to access this page. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      } else if (response.status === 403) {
        setMessage(
          "Only organization owners can access this page. Redirecting..."
        );
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      } else {
        setMessage("Access validation failed. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      }
    } catch (err) {
      console.error("Error validating owner access:", err);
      setMessage("Connection error. Redirecting...");
      setIsAuthorized(false);
      setTimeout(() => router.push("/organization"), 2000);
    }
  };

  useEffect(() => {
    validateAdminAccess();
  }, [organizationId]);

  {
    /*  useEffect(() => {
    if (isAuthorized) {
      const fetchAdmins = async () => {
        try {
          setIsLoading(true);
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

          const res = await fetch(
            `${apiUrl}/organization/org-admins/{organizationId}`,
            {
              credentials: "include",
            }
          );

          if (!res.ok) {
      console.error("Failed to load admins");
      return;
    }

          const data = await res.json();
          setAdmins(data.admins)

        ;
        } catch (error) {
          console.error(
            "Network error while loading organization profile:",
            error
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchAdmins();
    }
  }, [isAuthorized]);
 */
  }

  return (
    <ProtectedRoute requiredRole="organization">
      <div className="flex flex-col min-h-screen font-sans bg-light-beige">
        <Navbar userType="organization" />

        {/* Authorization Check */}
        {isAuthorized === null ? (
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pear-2 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating organization access...</p>
            </div>
          </main>
        ) : isAuthorized === false ? (
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <PearButton
                text="Back to Organizations"
                onClick={() => router.push("/organization")}
              />
            </div>
          </main>
        ) : (
          <main className="flex-1 p-8 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-[56px] font-extrabold text-[#0a0a0a] relative inline-block tracking-tight">
                Organization Admins
                <Squiggle
                  width={530}
                  className="left-1/2 -translate-x-1/2 -bottom-2"
                />
              </h1>
            </div>

            {/* Owners Section */}
            <h2 className="text-2xl font-semibold mb-4">Owners</h2>

            {/* Admins Section */}
            <h2 className="text-2xl font-semibold mb-4">Admins</h2>
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

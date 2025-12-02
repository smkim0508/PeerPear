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
    validateOwnerAccess();
  }, [organizationId]);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      const res = await fetch(
        `${apiUrl}/organization/org-admins/${organizationId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        console.error("Failed to load admins");
        return;
      }

      const data = await res.json();
      setAdmins(data.admins);
    } catch (error) {
      console.error("Network error while loading organization profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAdmins();
    }
  }, [isAuthorized, organizationId]);

  const handlePromote = async (userId: number) => {
    if (!confirm("Are you sure you want to promote this admin to owner?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/organization/org-admins/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, organization_id: organizationId }),
        credentials: "include",
      });

      if (response.ok) {
        fetchAdmins();
        alert("Admin promoted successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to promote admin");
      }
    } catch (error) {
      console.error("Error promoting admin:", error);
      alert("An error occurred");
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this admin from the organization?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(`${apiUrl}/organization/org-admins/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, organization_id: organizationId }),
        credentials: "include",
      });

      if (response.ok) {
        fetchAdmins();
        alert("Admin removed successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove admin");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("An error occurred");
    }
  };

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
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <div className="bg-pear-1 p-2 rounded-full">
                  <CheckCircle className="w-5 h-5 text-pear-3" />
                </div>
                Owners
              </h2>
              <div className="grid gap-4">
                {owners.length > 0 ? (
                  owners.map((owner) => (
                    <div
                      key={owner.id}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pear-1 rounded-full flex items-center justify-center text-pear-3 font-bold text-xl">
                          {owner.first_name[0]}
                          {owner.last_name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {owner.first_name} {owner.last_name}
                          </h3>
                          <p className="text-gray-500">{owner.email}</p>
                        </div>
                      </div>
                      <div className="px-4 py-1 bg-pear-1 text-pear-3 rounded-full text-sm font-medium">
                        Owner
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No owners found.</p>
                )}
              </div>
            </div>

            {/* Admins Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                Admins
              </h2>
              <div className="grid gap-4">
                {regularAdmins.length > 0 ? (
                  regularAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                          {admin.first_name[0]}
                          {admin.last_name[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {admin.first_name} {admin.last_name}
                          </h3>
                          <p className="text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handlePromote(admin.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Promote to Owner
                        </button>
                        <button
                          onClick={() => handleRemove(admin.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No other admins found.</p>
                )}
              </div>
            </div>
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

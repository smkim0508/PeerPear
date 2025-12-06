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

interface OrganizationProfileProps {
  params: Promise<{ slug: string }>;
}

export default function ProfilePage({ params }: OrganizationProfileProps) {
  const { slug } = use(params);
  const organizationId = parseInt(slug);
  const router = useRouter();
  const { user, refreshAuth } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [editName, setEditName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [nameTooLong, setNameTooLong] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Validate organization admin access
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
        setMessage("Please log in to access this organization profile. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);
      } else if (response.status === 403) {
        setMessage("You do not have admin access to this organization. Redirecting...");
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

  useEffect(() => {
    validateAdminAccess();
  }, [organizationId]);

  useEffect(() => {
    if (isAuthorized === true) {
      const fetchProfile = async () => {
        try {
          setIsLoading(true);
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

          const res = await fetch(
            `${apiUrl}/organization_profile/profile?organization_id=${organizationId}`,
            {
              credentials: "include",
            }
          );

          if (!res.ok) return;

          const data = await res.json();
          setOrgName(data.organization_name || "");
          setEditName(data.organization_name || "");
          setOrgDescription(data.description || "");
        } catch (error) {
          console.error(
            "Network error while loading organization profile:",
            error
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isAuthorized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: boolean } = {};
    if (!editName.trim()) newErrors.org_name = true;
    if (editName.length > 30) newErrors.nameTooLong = true;
    if (!orgDescription.trim()) newErrors.description = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setMessage("Some required fields are empty. Please fill them in.");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      const res = await fetch(
        `${apiUrl}/organization_profile/profile?organization_id=${organizationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            org_name: editName,
            description: orgDescription,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Profile updated successfully!");
        setOrgName(editName);
        setIsEditing(false);
        await refreshAuth();

        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating organization profile:", err);
      setMessage("Error saving profile. Please try again.");
    } finally {
      setIsLoading(false);
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
          <main className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-nav-dark">Organization Profile</h1>
            <p className="text-foreground/70 mt-1">Update your organization's name and description.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-nav-dark mb-1">Organization Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditName(value);
                    if (value.length > 30) setErrors((prev) => ({ ...prev, nameTooLong: true }));
                    else setErrors((prev) => ({ ...prev, nameTooLong: false }));
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors ${errors.org_name || errors.nameTooLong ? "border-red-500 bg-red-50" : "border-gray-200 bg-transparent focus:border-green"
                    }`}
                  placeholder="Enter organization name"
                  maxLength={50}
                />
                {errors.nameTooLong && (
                  <p className="text-red-600 text-sm mt-1">Organization name must be 30 characters or fewer.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-nav-dark mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors resize-none ${errors.description ? "border-red-500 bg-red-50" : "border-gray-200 bg-transparent focus:border-green"
                    }`}
                  placeholder="Tell us about your organization..."
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <PearButton text={isLoading ? "Saving..." : "Save Changes"} onClick={() => { }} />
                <PearButton
                  text="Cancel"
                  variant="outline"
                  onClick={() => {
                    setEditName(orgName);
                    setMessage(null);
                    setErrors({});
                  }}
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-center font-medium ${message.includes("success") ? "bg-green text-nav-dark" : "bg-red-100 text-red-800"}`}>{message}</div>
              )}
            </form>
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

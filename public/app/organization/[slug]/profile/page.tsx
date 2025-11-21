"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Squiggle } from "@/components/ui/Squiggle";
import { Building2, Edit3, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshAuth } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [editName, setEditName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(`${apiUrl}/organization_profile/profile`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        setOrgName(data.organization_name || "");
        setEditName(data.organization_name || "");
        setOrgDescription(data.description || "");
      } catch (error) {
        console.error("Network error while loading organization profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: boolean } = {};
    if (!editName.trim()) newErrors.org_name = true;
    if (!orgDescription.trim()) newErrors.description = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setMessage("Some required fields are empty. Please fill them in.");
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      const res = await fetch(`${apiUrl}/organization_profile/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          org_name: editName,
          description: orgDescription,
        }),
      });

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
      <main className="flex-1 p-8 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-[56px] font-extrabold text-[#0a0a0a] relative inline-block tracking-tight">
            Organization Profile
            <Squiggle width={530} className="left-1/2 -translate-x-1/2 -bottom-2" />
          </h1>
          <p className="mt-6 text-lg text-[#1a1a1a] max-w-2xl mx-auto">
            Manage your organization's profile information and settings
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#C3DD90] rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-2xl hover:brightness-105 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full p-3 shadow-md">
                <Building2 className="w-8 h-8 text-[#1a1a1a]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#0a0a0a]">
                  {orgName || "Your Organization"}
                </h2>
                <p className="text-[#1a1a1a] font-medium">Organization Details</p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="cursor-pointer bg-white hover:bg-gray-50 text-[#1a1a1a] px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-[#0a0a0a] mb-2">
                    Organization Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm text-[#1a1a1a] font-medium ${
                      errors.org_name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white focus:ring-white"
                    }`}
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-[#0a0a0a] mb-2">
                    Status <span className="text-red-600">*</span>
                  </label>
                  <div className="p-4 bg-white/60 rounded-lg border-2 border-white">
                    <span className="text-[#1a1a1a] font-medium">
                      Active Organization
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-[#0a0a0a] mb-2">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={4}
                  className={`w-full p-4 border-2 rounded-lg focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm text-[#1a1a1a] font-medium resize-none ${
                    errors.description
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white focus:ring-white"
                  }`}
                  placeholder="Tell us about your organization..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer bg-[#1a1a1a] hover:bg-[#0a0a0a] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(orgName);
                    setMessage(null);
                    setErrors({});
                  }}
                  className="cursor-pointer bg-white hover:bg-gray-50 text-[#1a1a1a] px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg text-center font-semibold ${
                    message.includes("success")
                      ? "bg-green text-nav-dark"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {message}
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">
                    Organization Name
                  </h3>
                  <p className="text-[#1a1a1a] font-medium text-xl">
                    {orgName || "Not set"}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">
                    Status
                  </h3>
                  <span className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-[#1a1a1a] font-medium">Active</span>
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">
                  Description
                </h3>
                <p className="text-[#1a1a1a] font-medium leading-relaxed">
                  {orgDescription ||
                    "No description provided yet. Click 'Edit Profile' to add one."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info Cards */}
        <div className="grid md:grid-cols-1 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">
              Need Help?
            </h3>
            <p className="text-[#1a1a1a] mb-4">
              Having trouble with your profile? Check out our help resources.
            </p>
            <button className="bg-green cursor-pointer hover:bg-[#c4de90] text-[#0a0a0a] px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
              Contact Support
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </ProtectedRoute>
  );
}

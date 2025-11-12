"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Squiggle } from "@/components/ui/Squiggle";
import { Building2, Edit3, Save, AlertCircle, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshAuth } = useAuth();
  const organizationId = user?.organizationId ?? 1;

  const [orgName, setOrgName] = useState("");
  const [editName, setEditName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(
          `${apiUrl}/organization_profile/profile/${organizationId}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (res.ok) {
          setOrgName(data.organization_name);
          setOrgDescription(data.description);
          setEditName(data.organization_name);
          console.log(orgName);
          console.log(orgDescription);
        } else {
          setMessage(data.error || "Failed to load organization profile");
        }
      } catch (error) {
        setMessage("Network error while loading organization profile");
      }
    };
    fetchProfile();
  }, [organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      return;
    }
    
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      const res = await fetch(
        `${apiUrl}/organization_profile/profile/${organizationId}`,
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
        setMessage(data.message || "Profile updated successfully");
        setOrgName(editName);
        setIsEditing(false);
        await refreshAuth();
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(data.message || "Failed to update profile");
      }
    } catch (err) {
      setMessage("Network error while updating organization profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <div className="bg-green rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-2xl hover:brightness-105 mb-8">
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
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-4 border-2 border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-white/80 backdrop-blur-sm text-[#1a1a1a] font-medium"
                    placeholder="Enter organization name"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-[#0a0a0a] mb-2">
                    Status
                  </label>
                  <div className="p-4 bg-white/60 rounded-lg border-2 border-white">
                    <span className="text-[#1a1a1a] font-medium">Active Organization</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-[#0a0a0a] mb-2">
                  Description
                </label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={4}
                  className="w-full p-4 border-2 border-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white bg-white/80 backdrop-blur-sm text-[#1a1a1a] font-medium resize-none"
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
                  }}
                  className="cursor-pointer bg-white hover:bg-gray-50 text-[#1a1a1a] px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">Organization Name</h3>
                  <p className="text-[#1a1a1a] font-medium text-xl">{orgName || "Not set"}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">Status</h3>
                  <span className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-[#1a1a1a] font-medium">Active</span>
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">Description</h3>
                <p className="text-[#1a1a1a] font-medium leading-relaxed">
                  {orgDescription || "No description provided yet. Click 'Edit Profile' to add one."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`rounded-xl p-6 flex items-center gap-4 transition-all duration-300 hover:scale-105 ${
            message.includes("successfully") || message.includes("success")
              ? "bg-green border-2 border-white"
              : "bg-red-100 border-2 border-red-300"
          }`}>
            {message.includes("successfully") || message.includes("success") ? (
              <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            )}
            <p className={`font-semibold ${
              message.includes("successfully") || message.includes("success")
                ? "text-[#0a0a0a]"
                : "text-red-800"
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Additional Info Cards */}
        <div className="grid md:grid-cols-1 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <h3 className="text-xl font-bold text-[#0a0a0a] mb-3">Need Help?</h3>
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
  );
}

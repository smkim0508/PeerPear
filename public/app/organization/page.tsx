"use client";

import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import JoinOrganizationModal from "@/components/JoinOrganizationModal";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import { Building } from 'lucide-react';
import PearButton
 from "@/components/PearButton";
interface Organization {
  id: number;
  name: string;
  image?: string;
  description?: string;
}

export default function OrganizationPage() {
  const { logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);
  const [currentOrgToLeave, setCurrentOrgToLeave] =
    useState<Organization | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // Fetch user's organizations
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/organization/myorganizations`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to view your organizations.");
        } else if (response.status === 403) {
          setError("You do not have permission to access organizations.");
        } else {
          setError("Failed to load organizations. Please try again.");
        }
        return;
      }

      const data = await response.json();

      // The API returns: { organizations: [{ id, org_name, description? }] }

      const defaultImage = "/logo.svg";

      const mappedOrgs: Organization[] = (data.organizations || []).map(
        (org: any) => ({
          id: org.id,
          name: org.org_name,
          image: defaultImage,
          description: org.description || "No description available",
        })
      );

      setOrganizations(mappedOrgs);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError("Failed to load organizations. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Function for leaving an organization
  const handleLeave = async (organization_id: number) => {
    try {
      const res = await fetch(`${apiUrl}/organization/org-admins/leave`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: organization_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setConfirmError(data.error || "Error with leaving this organization");
        return;
      }

      setConfirmSuccess(data.message || "Successfully left the organization.");
      await fetchOrganizations();
      setTimeout(() => setConfirmOpen(false), 1200);
    } catch (err) {
      setConfirmError(
        "Error with leaving this organization. Please check your connection"
      );
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="min-h-screen bg-dark-beige from-[#F5F7F0] via-[#8cbf70] to-[#8cbf70] flex items-center justify-center p-6">
      <button
        onClick={logout}
        className="flex flex-row fixed top-0 left-0 m-6 hover:font-bold cursor-pointer items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Logout
      </button>
      <div className="flex flex-col w-full items-center">
        {confirmSuccess && (
          <div className="mb-4 w-full max-w-2xl bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {confirmSuccess}
          </div>
        )}

        {confirmError && (
          <div className="mb-4 w-full max-w-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {confirmError}
          </div>
        )}

        <div className="bg-[#CCCEC1] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-primary/90 p-6 flex flex-col items-center text-center ">
          <div className="bg-nav-dark rounded-full p-4 mb-4">
            <Building className="text-white w-8 h-8"/>
            </div>
            <h1 className="text-3xl font-bold text-nav-dark text-center">
              Select An Organization
            </h1>
            <p className="text-gray-700 text-center mt-1">
              Choose an organization to view their dashboard
            </p>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto bg-white">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your organizations...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
                <button
                  onClick={fetchOrganizations}
                  className="px-4 py-2 bg-green text-black rounded hover:bg-green transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  You are not an admin of any organizations.
                </p>
                <p className="text-sm text-gray-500">
                  Contact your organization administrator to get access.
                </p>
              </div>
            ) : (
              organizations.map((org) => (
                <div
                  key={org.id}
                  className="
      flex items-center p-4
      rounded-xl
      border border-primary/20
      bg-white
      shadow-sm
      cursor-pointer
      transition-transform transition-shadow duration-200
      hover:shadow-md
      hover:-translate-y-1
    "
                  onClick={() =>
                    (window.location.href = `/organization/${org.id}`)
                  }
                >
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={org.image}
                      alt={`${org.name} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback image if the provided image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop&crop=center";
                      }}
                    />
                  </div>

                  <div className="ml-4 flex-grow">
                    <h3 className="font-semibold text-black transition-colors">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {org.description}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentOrgToLeave(org);
                      setConfirmOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Leave
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* OR Divider Section */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-400" />
          <span className="px-4 text-gray-600 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-400" />
        </div>

        {/* Join Organization Button */}
        <div className="flex justify-center mb-4">
          <PearButton
                    className="w-full cursor-pointer p-6 text-md"
                    text="Join An Organization"
                    onClick={ () => {setIsModalOpen(true)}}
                  />
        </div>
      </div>
      <JoinOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {currentOrgToLeave && (
        <ConfirmActionModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          message={`Are you sure you want to leave ${currentOrgToLeave?.name}?`}
          onConfirm={() => {
            handleLeave(currentOrgToLeave.id);
          }}
        />
      )}
    </div>
  );
}

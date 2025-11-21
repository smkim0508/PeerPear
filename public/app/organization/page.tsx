'use client';

import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface Organization {
  id: number;
  name: string;
  image?: string;
  description?: string;
}

interface OrganizationProps {
  params: { slug: string };
}
interface OrganizationProps {
  params: { slug: string };
}

export default function OrganizationPage({ params }: OrganizationProps) {
  const { slug } = params;
  const organizationId = parseInt(slug);
  const { logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's organizations
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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

      const mappedOrgs: Organization[] = (data.organizations || []).map((org: any) => ({
        id: org.id,
        name: org.org_name,
        image: defaultImage,
        description: org.description || "No description available"
      }));

      setOrganizations(mappedOrgs);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError("Failed to load organizations. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7F0] via-[#E8F4D6] to-[#D7E8C2] flex items-center justify-center p-6">
      <button
        onClick={logout}
        className="flex flex-row fixed top-0 left-0 m-6 hover:font-bold cursor-pointer items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Logout
      </button>
      <div className="bg-[#CCCEC1] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#ABC469] p-6">
          <h1 className="text-2xl font-bold text-black text-center">Select an Organization</h1>
          <p className="text-black text-center mt-2">Choose an organization to view their dashboard</p>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto bg-[#d7d8d1]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ABC469] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your organizations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
              <button
                onClick={fetchOrganizations}
                className="px-4 py-2 bg-[#ABC469] text-black rounded hover:bg-[#9BB359] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You are not an admin of any organizations.</p>
              <p className="text-sm text-gray-500">Contact your organization administrator to get access.</p>
            </div>
          ) : (
            organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center p-4 rounded-xl border bg-[#E5E6DD] hover:bg-[#ABC469] cursor-pointer transition-colors"
                onClick={() => window.location.href = `/organization/${org.id}`}
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <img
                    src={org.image}
                    alt={`${org.name} logo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback image if the provided image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop&crop=center";
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
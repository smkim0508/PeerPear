"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithCAS } from "@/lib/auth";
import PearButton from "./PearButton";
import { LogIn, User, Building2, X } from "lucide-react";

interface JoinOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Organization {
  id: number;
  title: string;
  description: string;
}

export default function JoinOrganizationModal({
  isOpen,
  onClose,
}: JoinOrganizationModalProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const [isAnimating, setIsAnimating] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  const [filtered, setFiltered] = useState<Organization[]>([]);

  //show
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // call on open and on succesful request
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const response = await fetch(
        `${apiUrl}/organization/available-organizations`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setError("Failed to load organizations. Please try again.");
      }

      const data = await response.json();

      // The API returns: { organizations: [{ id, org_name, description? }] }

      const mappedOrgs: Organization[] = (data.organizations || []).map(
        (org: any) => ({
          id: org.id,
          title: org.org_name,
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

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000); // disappears after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    fetchOrganizations();
  }, [isOpen]);

  useEffect(() => {
    setFiltered(
      organizations.filter((org) =>
        org.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, organizations]);

  const handleRequest = async (organization_id: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload = { organization_id: organization_id };

      const response = await fetch(`${apiUrl}/organization/admin-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send request to organization");
      }

      fetchOrganizations();
      setSuccess("Request sent!");
      setError(null);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setError(
        "Failed to send request to this organization. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transition-all duration-300 relative ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-primary/10 rounded-full p-4 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join An Organization
          </h2>
          <p className="text-gray-600 text-base">
            Send a request to join an organization
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="w-full bg-green border border-green text-nav-dark px-3 py-2 rounded mb-3 text-sm">
            {success}
          </div>
        )}
        {/* Search bar */}
        <div className="relative w-full mb-4">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
      w-full h-12 px-4 pr-12
      rounded-xl
      bg-white
      border border-gray-300
      shadow-sm
      text-sm
      focus:ring-2 focus:ring-primary/40
      focus:border-primary/60
      transition-all
      outline-none
    "
          />

          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green mb-3"></div>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-600 text-center">
              There are no organizations that you can request to join.
            </p>
          ) : (
            filtered.map((org) => (
              <div
                key={org.id}
                className="
    p-4
    border border-gray-200
    rounded-xl
    bg-white
    shadow-sm
    flex justify-between items-center
    transition-all
    hover:shadow-md
    hover:-translate-y-0.5
  "
              >
                <div className="text-left">
                  <h3 className="font-semibold text-black">{org.title}</h3>
                  <p className="text-xs text-gray-600">{org.description}</p>
                </div>

                <button
                  className="bg-primary hover:bg-primary/90 cursor-pointer transition-colors text-black px-3 py-1 rounded-lg text-sm font-medium"
                  onClick={() => {
                    handleRequest(org.id);
                  }}
                >
                  Request
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

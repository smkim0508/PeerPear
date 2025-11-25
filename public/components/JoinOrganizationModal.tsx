"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithCAS } from "@/lib/auth";
import PearButton from "./PearButton";

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
  const [success,setSuccess] = useState<string | null>(null);

  const mockOrganizations: Organization[] = [
    { id: 1, title: "CS Club", description: "Computer Science Club" },
    { id: 2, title: "Princeton Debate Panel", description: "Debate Society" },
    { id: 3, title: "Dance Company", description: "Student Dance Group" },
  ];

  // call on open and on succesful request
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
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
    setFiltered(
      mockOrganizations.filter((org) =>
        org.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery,isOpen]);

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
      className={`fixed inset-0 bg-[#0000003c] flex items-center text-center  justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-6 max-w-[420px] w-full mx-4 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1.5 text-[#1a1a1a]">
          Request to join an organization
        </h2>
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search organizations..."
          className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-sm mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="max-h-64 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-600 text-center">
              No matching organizations found.
            </p>
          ) : (
            filtered.map((org) => (
              <div
                key={org.id}
                className="p-3 border rounded-lg bg-white shadow-sm flex justify-between items-center"
              >
                <div className="text-left">
                  <h3 className="font-semibold text-black">{org.title}</h3>
                  <p className="text-xs text-gray-600">{org.description}</p>
                </div>

                <button
                  className="bg-[#ABC469] hover:bg-[#9BB359] transition-colors text-black px-3 py-1 rounded-lg text-sm font-medium"
                  onClick={() => {
                    console.log(`Would call: await fetch(${apiUrl}/organization/admin-request, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }, credentials: "include",
        })`) ;
                    console.log("Payload:", {
                      organization_id: org.id,
                    });
                  }}
                >
                  Request
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer (placeholder for now) */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

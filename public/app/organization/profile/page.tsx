"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { describe } from "node:test";

export default function ProfilePage() {
  // Change this later
  const organization_id = 1;

  const [orgName, setOrgName] = useState("");
  const [editName, setEditName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(
          `${apiUrl}/organization_profile/profile/${organization_id}`
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      const res = await fetch(
        `${apiUrl}/organization_profile/profile/${organization_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      } else {
        setMessage(data.message || "Failed to update profile");
      }
    } catch (err) {
      setMessage("Network error while updating organization profile");
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f3f4ef]">
      <Navbar userType="organization" />
      <main className="flex-1 p-10 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-[#4a6b1e]">{orgName}</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-6 border border-gray-200"
        >
          <div>
            <label className="block text-lg font-semibold mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4de90]"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">
              Description
            </label>
            <textarea
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c4de90]"
            />
          </div>

          <button
            type="submit"
            className="bg-[#c4de90] hover:bg-[#b6d179] text-[#384f1a] px-6 py-3 rounded-lg font-semibold transition"
          >
            Save Changes
          </button>
        </form>
        {message && (
          <div className="mt-6 text-center text-sm text-gray-700">
            {message}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

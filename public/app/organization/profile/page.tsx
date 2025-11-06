"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  // Change this later
  const organization_id = 1;

  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(
          `${apiUrl}/organization_profile/${organization_id}`
        );
        const data = await res.json();

        if (res.ok) {
          setOrgName(data.organization_name);
          setOrgDescription(data.description);
        } else {
          setMessage(data.error || "Failed to load organization profile");
        }
      } catch (error) {
        setMessage("Network error while loading organization profile");
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f3f4ef]">
      <Navbar userType="organization" />
      <main className="flex-1 p-10 max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-12">Hello Organization Name </h1>
      </main>
      <Footer />
    </div>
  );
}

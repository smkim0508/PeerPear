"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "@/components/EventCard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrganizationDashBoard() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Store user type preference for navbar
    localStorage.setItem('userType', 'organization');
  }, []);

  return (
    <ProtectedRoute>
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="organization" />
        <main className="m-4 p-6 flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto mb-6">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600 mb-6">Organization Dashboard</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {/* Organization-specific content here */}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

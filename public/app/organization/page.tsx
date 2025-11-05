"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "@/components/EventCard";
import { useRouter } from "next/navigation";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";

export default function OrganizationDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  
  // change later, hardcoded for testing
  const organization_id = 1;

  useEffect(() => {
    // Store user type preference for navbar
    localStorage.setItem("userType", "organization");

    const fetchEvents = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${apiUrl}/organization_dashboard/event-browse?organization_id=${organization_id}`,
          {
            credentials: "include", // Include cookies for authentication
          }
        );
        const data = await res.json();
        setEvents(data.events);
        console.log(data.events);
      } catch (err) {
        console.log("Error fetching events", err);
      }
    };
    fetchEvents();
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

            {/* this is just for testing*/}
            {events.map((event) => (
              <h1 key = {event.id} > {event.organization_name} </h1>))}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

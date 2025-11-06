"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "@/components/EventCard";
import CreateEventModal from "@/components/CreateEventModal";
import { useRouter } from "next/navigation";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";
import PearButton from "@/components/PearButton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function OrganizationDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // change later, hardcoded for testing
  const organization_id = 1;

  const fetchEvents = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
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

  useEffect(() => {
    // Store user type preference for navbar
    localStorage.setItem("userType", "organization");

    fetchEvents();
  }, []);

  const handleEventSuccess = async () => {
    await fetchEvents();
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000); // hide after 3s
  };

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
            <div className="flex justify-center my-8">
              <PearButton
                text="Create New Event"
                className="w-[300px] sm:w-[400px] lg:w-[500px] text-xl py-4 "
                onClick={() => setIsModalOpen(true)}
              />
            </div>
          </div>
          {showSuccessAlert && (
            <div className="fixed top-20 right-4 z-50">
              <Alert className="border-green-400 bg-green-50 shadow-md">
                <AlertTitle className="font-semibold text-green-700">
                  Event Created
                </AlertTitle>
                <AlertDescription className="text-green-600">
                  Your event was successfully added!
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                      {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
          <CreateEventModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            organization_id={organization_id}
            onSuccess={handleEventSuccess}
          />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

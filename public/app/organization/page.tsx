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
import PearSwitch from "@/components/PearSwitch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function OrganizationDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All Events");

  // change later, hardcoded for testing
  const organization_id = 1;

  const tabOptions = ["All Events", "Not Started", "Active", "Ended"];


  const getFilterValue = (tabName: string) => {
    switch (tabName) {
      case "All Events": return "all";
      case "Not Started": return "notStarted";
      case "Active": return "active";
      case "Ended": return "ended";
      default: return "all";
    }
  };

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

  const today = new Date();
  const filteredEvents = events.filter((event) => {
    const start_date = new Date(event.start_date);
    const end_date = new Date(event.end_date);
    const filterValue = getFilterValue(activeTab);

    switch (filterValue) {
      // need to fix active logic later
      case "active":
        return today >= start_date && today <= end_date;
      case "notStarted":
        return today < start_date;
      case "ended":
        return today > end_date;
      default:
        return true;
    }
  });

  return (
    <ProtectedRoute>
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="organization" />
        <main className="m-4 p-6 flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto mb-6">
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

          <div className="flex justify-center mb-8">
            <PearSwitch
              options={tabOptions}
              activeOption={activeTab}
              onOptionChange={setActiveTab}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredEvents.map((event) => (
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

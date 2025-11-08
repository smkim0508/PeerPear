"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import PearSwitch from "@/components/PearSwitch";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";
import { isPast } from "date-fns";
import PearButton from "@/components/PearButton";

export default function StudentDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [filterOption, setFilterOption] = useState<string>("All Events");

  useEffect(() => {
    // Store user type preference for navbar
    localStorage.setItem("userType", "student");

    const fetchMyEvents = async () => {
      try {
        const hardcodedUserId = 4;
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${apiUrl}/my_events_dashboard/my-event-browse?user_id=${hardcodedUserId}`,
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
    fetchMyEvents();
  }, []);

  // Filter events based on selected option
  const filteredEvents = events.filter((event) => {
    switch (filterOption) {
      case "Active":
        return event.status === "STARTED";
      case "Terminated":
        return event.status === "TERMINATED";
      case "Results Published":
        return event.status === "PAIRING_PUBLISHED";
      case "All Events":
      default:
        return true;
    }
  });

  return (
    <ProtectedRoute>
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="student" />

        <main className="text-center m-2 sm:m-4 p-4 sm:p-6 flex-1 min-h-screen">
          <div className="flex flex-col items-center max-w-7xl mx-auto mb-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
              My Registered Events
            </h1>
            <PearSwitch
              options={["All Events", "Active", "Ended", "Results Available"]}
              activeOption={filterOption}
              onOptionChange={setFilterOption}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

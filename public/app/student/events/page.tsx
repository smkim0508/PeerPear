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
import { parseISO } from "date-fns";

export default function StudentDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [filterOption, setFilterOption] = useState<string>("All Events");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${apiUrl}/my_events_dashboard/my-event-browse`,
          {
            credentials: "include", // Include cookies for authentication
          }
        );
        
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in to view your registered events.");
          } else {
            setError("Failed to load events. Please try again.");
          }
          return;
        }
        
        const data = await res.json();
        setEvents(data.events || []);
        console.log(data.events);
      } catch (err) {
        console.log("Error fetching events", err);
        setError("Failed to load events. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(
        `${apiUrl}/my_events_dashboard/my-event-browse`,
        {
          credentials: "include",
        }
      );
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view your registered events.");
        } else {
          setError("Failed to load events. Please try again.");
        }
        return;
      }
      
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.log("Error fetching events", err);
      setError("Failed to load events. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on selected option

  const filteredEvents = events.filter((event) => {
    const endDate = event.end_date ? parseISO(event.end_date) : null;
    const isEnded = endDate ? isPast(endDate) : false;

    switch (filterOption) {
      case "Active":
        // Show STARTED events that are still ongoing
        return event.status === "STARTED" && !isEnded;

      case "Ended":
        // Either manually terminated or auto-ended (past end_date)
        return event.status === "TERMINATED" || isEnded;

      case "Results Available":
        // Explicitly published events
        return event.status === "PAIRING_PUBLISHED";

      case "All Events":
      default:
        return true;
    }
  });

  return (
    <ProtectedRoute requiredRole="student">
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="student" />

        <main className=" m-2 sm:m-4 p-4 sm:p-6 flex-1 min-h-screen">
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
          
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your events...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <PearButton
                  text="Retry"
                  onClick={handleRetry}
                />
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No events found for the selected filter.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

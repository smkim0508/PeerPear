"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import PearButton from "@/components/PearButton";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";
import { isPast, parseISO } from "date-fns";

export default function StudentDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [filterOption, setFilterOption] = useState<string>("All Programs");
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
          { credentials: "include" }
        );

        if (!res.ok) {
          setError(
            res.status === 401
              ? "Please log in to view your registered programs."
              : "Failed to load programs. Please try again."
          );
          return;
        }

        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.log("Error fetching programs", err);
        setError("Failed to load programs. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(
        `${apiUrl}/my_events_dashboard/my-event-browse`,
        { credentials: "include" }
      );
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Please log in to view your registered programs."
            : "Failed to load programs. Please try again."
        );
        return;
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.log(err);
      setError("Failed to load programs. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const endDate = event.end_date ? parseISO(event.end_date) : null;
    const isEnded = endDate ? isPast(endDate) : false;
    switch (filterOption) {
      case "Active":
        return event.status === "STARTED" && !isEnded;
      case "Ended":
        return event.status === "TERMINATED" || isEnded;
      case "Results Available":
        return event.status === "PAIRING_PUBLISHED";
      default:
        return true;
    }
  });

  return (
    <ProtectedRoute requiredRole="student">
      <div className="font-sans flex flex-col min-h-screen bg-gray-50">
        <Navbar userType="student" />

        <main className="m-2 sm:m-4 p-4 sm:p-6 flex-1 min-h-screen">
          <div className="flex flex-col items-center max-w-7xl mx-auto mb-6">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              My Registered Programs
            </h1>

            {/* Native dropdown */}
            <div className="w-full max-w-xs">
              <label
                htmlFor="eventFilter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter Programs
              </label>
              <div className="relative">
                <select
                  id="eventFilter"
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  className="
                    block w-full appearance-none bg-white border border-gray-300
                    rounded-xl py-2 pl-4 pr-10 text-gray-700 shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    sm:text-sm transition-all duration-200 hover:border-gray-400
                  "
                >
                  {["All Programs", "Active", "Ended", "Results Available"].map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Event Cards */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your programs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <PearButton text="Retry" onClick={handleRetry} />
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-gray-600 text-lg">
                  No programs found for the selected filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
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

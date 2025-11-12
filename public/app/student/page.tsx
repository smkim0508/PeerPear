"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";

export default function StudentDashBoard() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"event" | "organization">("event");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${apiUrl}/student_dashboard/event-browse`,
          {
            credentials: "include", // Include cookies for authentication
          }
        );
        
        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in to view events.");
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
    fetchEvents();
  }, []);

  // Rudimentary filtering logic TODO: FIX ORGANIZATION SEARCH + animate?
  const filteredEvents =
    activeTab == "event"
      ? events.filter((event) => {
          return event.title.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : events.filter((event) => {
          return String(event.organization_name)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });

  return (
    <ProtectedRoute>
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="student" />

        <main className="m-2 sm:m-4 p-4 sm:p-6 flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto mb-6">
            <SearchBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-red-600 text-lg">{error}</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No events found.</p>
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

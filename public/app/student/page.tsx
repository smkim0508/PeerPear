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
import { checkUserRegistration } from "@/lib/events";

export default function StudentDashBoard() {
  const router = useRouter();
  const { user } = useAuth();

  // SearchBar filters
  const [eventTab, setEventTab] = useState<"event" | "organization">("event");
  const [searchQuery, setSearchQuery] = useState("");

  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract "19 days left" into a number
  function getDaysLeft(event: any): number {
    if (typeof event.days_left === "number") return event.days_left;
    if (typeof event.days_left === "string") {
      const match = event.days_left.match(/-?\d+/);
      return match ? parseInt(match[0]) : 9999;
    }
    return 9999;
  }

  // Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(`${apiUrl}/student_dashboard/event-browse`, {
          credentials: "include",
        });

        if (!res.ok) {
          setError(res.status === 401 ? "Please log in to view events." : "Failed to load events.");
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

    fetchEvents();
  }, []);

  // Check registration state
  useEffect(() => {
    if (!user?.username || events.length === 0) return;

    const checkStatuses = async () => {
      try {
        const checks = events.map(async (event) => {
          const isRegistered = await checkUserRegistration(user.username, event.id);
          return { id: event.id, isRegistered };
        });

        const results = await Promise.all(checks);

        setRegisteredEvents(
          new Set(results.filter((r) => r.isRegistered).map((r) => r.id))
        );
      } catch (err) {
        console.log("Error checking registration", err);
      }
    };

    checkStatuses();
  }, [user?.username, events]);

  // Search & org/event filter
  const filteredEvents =
    eventTab === "event"
      ? events.filter((event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : events.filter((event) =>
          String(event.organization_name)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );

  return (
    <ProtectedRoute requiredRole="student">
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="student" />

        <main className="m-2 sm:m-4 p-4 sm:p-6 flex-1 min-h-screen">
          {/* Search + event/org filter */}
          <div className="max-w-7xl mx-auto mb-2">
            <SearchBar
              activeTab={eventTab}
              setActiveTab={setEventTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Loading / Error / No results / List */}
          {loading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading events...</p>
              </div>
            </div>
          ) : error ? (
            <p className="text-center text-red-600 text-lg">{error}</p>
          ) : filteredEvents.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">No events found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRegistered={registeredEvents.has(event.id)}
                />
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}

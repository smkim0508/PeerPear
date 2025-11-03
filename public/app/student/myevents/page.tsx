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

  useEffect(() => {
    // Store user type preference for navbar
    localStorage.setItem('userType', 'student');
    
    const fetchEvents = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(
          `${apiUrl}/student-dashboard/event-browse`,
          {
            credentials: 'include', // Include cookies for authentication
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

  // Rudimentary filtering logic TODO: FIX ORGANIZATION SEARCH + animate?
  const filteredEvents =
    activeTab == "event"
      ? events.filter((event) => {
          return event.title.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : events.filter((event) => {
          return String(event.organization_id)
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

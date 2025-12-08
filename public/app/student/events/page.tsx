"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import PearButton from "@/components/PearButton";
import PearSwitch from "@/components/PearSwitch";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";
import { isPast, parseISO } from "date-fns";
import { Squiggle } from "@/components/ui/Squiggle";

export default function StudentDashBoard() {
  const router = useRouter();
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
        return event.status === "STARTED";
      case "Ended":
        return event.status === "TERMINATED";
      case "Results Available":
        return event.status === "PAIRING_PUBLISHED";
      default:
        return true;
    }
  });

  return (
    <ProtectedRoute requiredRole="student">
      <div className="font-sans flex flex-col min-h-screen bg-light-beige">
        <Navbar userType="student" />

        <main className="m-2 sm:m-4 p-4 sm:p-6 flex-1 min-h-screen">
          <div className="max-w-7xl mx-auto mb-9 text-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-nav-dark mb-5">My {" "}
              <div className=" relative inline-block whitespace-nowrap ">
                Registered Programs
              <Squiggle width = {400} className="left-0 right-0 -bottom-4 hidden lg:flex"/>
              
              </div>
            </h1>
           
              <p className="text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed mb-8">View and filter programs you’ve joined.</p>
              <PearSwitch
                options={["All Programs", "Active", "Ended", "Results Available"]}
                activeOption={filterOption}
                onOptionChange={(opt) => setFilterOption(opt)}
                className="shrink-0"
              />
         
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

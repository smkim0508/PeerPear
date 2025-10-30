"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import { PairingEvent } from "@/types/events";
import { useEffect, useState } from "react";

export default function StudentDashBoard() {
  const router = useRouter();
  const [events, setEvents] = useState<PairingEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:5000/student-dashboard/event-browse"
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
  const handleLogout = async () => {
    try {
      await router.push("/");
    } catch (error) {
      console.log("Navigation error: ", error);
    }
  };
  return (
    <div className="font-sans flex flex-col min-h-screen">
      <Navbar userType="student" onLogoutClick={handleLogout} />

      <main className="m-4 p-6 flex-1 min-h-screen">
        <div className="max-w-7xl mx-auto mb-4">
          <SearchBar />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
        </div>
      </main>
      <Footer />
    </div>
  );
}

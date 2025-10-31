"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { PairingEvent } from "@/types/events";

export default function MyEventsPage() {
    return (
        <div>
            <Navbar userType="student" />
            <h1>My Events</h1>
    
            <Footer />
        </div>
    );
}

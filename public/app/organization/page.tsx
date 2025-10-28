"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { useRouter } from "next/navigation";

export default function OrganizationDashBoard() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await router.push("/");
    } catch (error) {
      console.log("Navigation error: ", error);
    }
  };
  return (
    <div className="font-sans flex flex-col min-h-screen">
      <Navbar userType="organization" onLogoutClick={handleLogout} />
      <main className="m-4 p-6 grid grid-cols-4 gap-2 min-h-screen">
       
      </main>
      <Footer />
    </div>
  );
}

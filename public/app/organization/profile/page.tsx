"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f3f4ef]">
      <Navbar userType="organization" />
      <main className="flex-1 p-10 max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-12">Hello Organization Name </h1>
      </main>
      <Footer />
    </div>
  );
}

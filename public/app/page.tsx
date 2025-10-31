"use client";

import { useState, useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import Navbar from "@/components/Navbar";
import PearButton from "@/components/PearButton";

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Handle post-login redirects - removed auto-redirect to let users stay on home page after logout
  useEffect(() => {}, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="font-sans min-h-screen flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect authenticated users based on what they logged in as
  const storedUserType = localStorage.getItem("userType") as
    | "student"
    | "organization"
    | null;
  if (isAuthenticated) {
    redirect(`/${storedUserType}`);
  }

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Navbar onLoginClick={openLoginModal} userType="guest" />

      <main className="flex-1">
        <Hero onTryNowClick={openLoginModal} />
        <Features />

        <section className="relative text-center bg-light-beige">
          {/* Wave at top of CTA section - transitions from dark beige features section */}
          <div className="w-full leading-0">
            <img src="/wave-2.svg" alt="" className="block w-full" />
          </div>

          <div className="px-8 py-6 pb-18">
            <h3 className="text-4xl m-0 mt-8 font-extrabold italic text-[rgb(10,10,10)] tracking-tight">
              Ready to simplify your pairings?
            </h3>
            <div className="mt-5">
              <PearButton text="Get started" onClick={openLoginModal} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </div>
  );
}

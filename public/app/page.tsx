"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import Navbar from "@/components/Navbar";
import PearButton from "@/components/PearButton";


export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { isAuthenticated, user, isLoading, verifyAndRedirectToOrganization } = useAuth();
  const router = useRouter();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Handle post-login redirects and check for auth errors
  useEffect(() => {
    // Check for auth error message from localStorage
    const errorMessage = localStorage.getItem("authError");
    if (errorMessage) {
      setAuthError(errorMessage);
      localStorage.removeItem("authError"); // Clear it after reading
    }

    // If user is authenticated, handle redirects based on userType
    if (isAuthenticated && !isLoading) {
      const storedUserType = localStorage.getItem("userType") as
        | "student"
        | "organization"
        | null;

      if (storedUserType === "organization") {
        // Verify organization access before redirecting
        verifyAndRedirectToOrganization();
      } else if (storedUserType === "student") {
        router.push("/student");
      }
    }
  }, [isAuthenticated, isLoading, router, verifyAndRedirectToOrganization]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#C3DD90]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Navbar onLoginClick={openLoginModal} userType="guest" />

      {/* Error message display */}
      {authError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative">
          <strong className="font-bold">Access Denied: </strong>
          <span className="block sm:inline">{authError}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setAuthError(null)}
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

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

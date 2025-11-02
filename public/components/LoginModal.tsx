"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithCAS } from "@/lib/auth";
import PearButton from "./PearButton";
import PearSwitch from "./PearSwitch";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"student" | "organization">(
    "student"
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLogin = async () => {
    try {
      onClose();

      // Store the user type preference in localStorage for after login redirect
      localStorage.setItem("userType", activeTab);

      // Redirect to CAS login with the appropriate dashboard URL
      const dashboardUrl = `${window.location.origin}/${activeTab}`;
      loginWithCAS(dashboardUrl);
    } catch (error) {
      console.log("Login error: ", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-[#0000003c] flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-6 max-w-[420px] w-full mx-4 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1.5 text-[#1a1a1a]">
          Log in to your account
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          Are you logging in as a student or organization?
        </p>

        <PearSwitch
          option1="student"
          option2="organization"
          activeOption={activeTab}
          onOptionChange={(option) =>
            setActiveTab(option as "student" | "organization")
          }
        />
        <PearButton
          className="w-full"
          text="Log in with CAS"
          onClick={handleLogin}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginWithCAS } from "@/lib/auth";
import PearButton from "./PearButton";
import PearSwitch from "./PearSwitch";
import { LogIn, User, Building2, X } from "lucide-react";

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

      localStorage.setItem("userType", activeTab);

      const dashboardUrl =
        activeTab === "student"
          ? `${window.location.origin}/student/events`
          : `${window.location.origin}/${activeTab}`;
      loginWithCAS(dashboardUrl);
    } catch (error) {
      console.log("Login error: ", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      document.body.style.overflow = "auto";
      setIsAnimating(false);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transition-all duration-300 relative ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-primary/10 rounded-full p-4 mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Log In
          </h2>
          <p className="text-gray-600 text-base">
            Choose your account type to continue
          </p>
        </div>

        <div className="mb-6">
      
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setActiveTab("student")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                activeTab === "student"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <User className={`w-6 h-6 ${activeTab === "student" ? "text-primary" : "text-gray-400"}`} />
              <span className={`text-sm font-semibold ${activeTab === "student" ? "text-primary" : "text-gray-700"}`}>
                Student
              </span>
            </button>

            <button
              onClick={() => setActiveTab("organization")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                activeTab === "organization"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Building2 className={`w-6 h-6 ${activeTab === "organization" ? "text-primary" : "text-gray-400"}`} />
              <span className={`text-sm font-semibold ${activeTab === "organization" ? "text-primary" : "text-gray-700"}`}>
                Organization
              </span>
            </button>
          </div>
        </div>

        <PearButton
          className="w-full cursor-pointer hover:scale-105 hover:shadow-lg"
          text="Continue with CAS"
          onClick={handleLogin}
        />

        <p className="text-xs text-gray-500 text-center mt-4">
          You'll be redirected to Princeton CAS for authentication
        </p>
      </div>
    </div>
  );
}
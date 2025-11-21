"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "@/components/EventCard";
import CreateEventModal from "@/components/CreateEventModal";
import { useRouter } from "next/navigation";
import { PairingEvent } from "@/types/events";
import { useEffect, useState, use } from "react";
import PearButton from "@/components/PearButton";
import PearSwitch from "@/components/PearSwitch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { parseISO, isPast } from "date-fns";

interface OrganizationDashboardProps {
  params: Promise<{ slug: string }>;
}

export default function OrganizationDashBoard({ params }: OrganizationDashboardProps) {
  const { slug } = use(params);
  const organizationId = parseInt(slug);
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All Events");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Validate organization admin access
  const validateAdminAccess = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${apiUrl}/organization/validate-admin/${organizationId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        setIsAuthorized(true);
      } else if (response.status === 401) {
        setError("Please log in to access this organization dashboard.");
        setIsAuthorized(false);
      } else if (response.status === 403) {
        setError("You do not have admin access to this organization.");
        setIsAuthorized(false);
      } else {
        setError("Failed to validate organization access.");
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error("Error validating admin access:", err);
      setError("Failed to validate organization access. Please check your connection.");
      setIsAuthorized(false);
    }
  };

  const tabOptions = [
    "All Events",
    "Not Started",
    "Active",
    "Unpublished",
    "Published Matches",
  ];

  const getFilterValue = (tabName: string) => {
    switch (tabName) {
      case "All Events":
        return "all";
      case "Not Started":
        return "notStarted";
      case "Active":
        return "active";
      case "Unpublished":
        return "terminated";
      case "Published Matches":
        return "published";
      default:
        return "all";
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(
        `${apiUrl}/organization_dashboard/event-browse`,
        {
          credentials: "include", // Include cookies for authentication
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view events.");
        } else if (res.status === 403) {
          setError("You do not have permission to access organization events.");
        } else {
          setError("Failed to load events. Please try again.");
        }
        return;
      }

      const data = await res.json();
      setEvents(data.events);
      console.log(data.events);
    } catch (err) {
      console.log("Error fetching events", err);
      setError("Failed to load events. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateAdminAccess();
  }, [organizationId]);

  useEffect(() => {
    if (isAuthorized === true) {
      fetchEvents();
    }
  }, [isAuthorized]);

  const handleEventSuccess = async () => {
    await fetchEvents();
  };

  const today = new Date();

  const filteredEvents = events.filter((event) => {
    const filterValue = getFilterValue(activeTab);
    const status = event.status?.toUpperCase?.() || "";
    const endDate = event.end_date ? parseISO(event.end_date) : null;
    const isEnded = endDate ? isPast(endDate) : false;

    switch (filterValue) {
      case "notStarted":
        return status === "NOT_STARTED";

      case "active":
        return status === "STARTED" && !isEnded;

      case "terminated":
        return status === "TERMINATED" || (status === "STARTED" && isEnded);

      case "published":
        return status === "PAIRING_PUBLISHED";

      default:
        return true;
    }
  });

  return (
    <ProtectedRoute requiredRole="organization">
      <div className="font-sans flex flex-col min-h-screen">
        <Navbar userType="organization" />

        {/* Authorization Check */}
        {isAuthorized === null ? (
          <main className="flex-1 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pear-2 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating organization access...</p>
            </div>
          </main>
        ) : isAuthorized === false ? (
          <main className="flex-1 min-h-screen flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <Alert className="mb-4">
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <PearButton
                text="Back to Organizations"
                onClick={() => router.push('/organization')}
              />
            </div>
          </main>
        ) : (
          <main className="m-4 p-6 flex-1 min-h-screen">
            <div className="max-w-7xl mx-auto mb-6">
              <div className="flex justify-center my-8">
                <PearButton
                  text="Create New Event"
                  className="w-[300px] sm:w-[400px] lg:w-[500px] text-xl py-4 "
                  onClick={() => setIsModalOpen(true)}
                />
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <PearSwitch
                options={tabOptions}
                activeOption={activeTab}
                onOptionChange={setActiveTab}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <CreateEventModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={handleEventSuccess}
            />
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

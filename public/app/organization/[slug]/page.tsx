"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import EventCard from "@/components/EventCard";
import CreateEventModal from "@/components/CreateEventModal";
import { useRouter } from "next/navigation";
import { PairingEvent } from "@/types/events";
import { useEffect, useState, use } from "react";
  import PearButton from "@/components/PearButton";
  import { Button } from "@/components/ui/button";
  import PearSwitch from "@/components/PearSwitch";
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import { parseISO, isPast } from "date-fns";
  import { Plus } from "lucide-react";

interface OrganizationDashboardProps {
  params: Promise<{ slug: string }>;
}

export default function OrganizationDashBoard({ params }: OrganizationDashboardProps) {
  const { slug } = use(params);
  const organizationId = parseInt(slug);
  const router = useRouter();
  const [events, setEvents] = useState<PairingEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All Programs");
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
        setError("Please log in to access this organization dashboard. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);

      } else if (response.status === 403) {
        setError("You do not have admin access to this organization.Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);

      } else {
        setError("Failed to validate organization access. Redirecting...");
        setIsAuthorized(false);
        setTimeout(() => router.push("/organization"), 2000);

      }
    } catch (err) {
      console.error("Error validating admin access:", err);
      setError("Failed to validate organization access. Please check your connection. Redirecting...");
      setIsAuthorized(false);
      setTimeout(() => router.push("/organization"), 2000);

    }
  };

  const tabOptions = [
    "All Programs",
    "Not Started",
    "Active",
    "Unpublished",
    "Published Matches",
  ];

  const getFilterValue = (tabName: string) => {
    switch (tabName) {
      case "All Programs":
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
        `${apiUrl}/organization_dashboard/event-browse?organization_id=${organizationId}`,
        {
          credentials: "include", // Include cookies for authentication
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in to view programs.");
        } else if (res.status === 403) {
          setError("You do not have permission to access organization programs.");
        } else {
          setError("Failed to load programs. Please try again.");
        }
        return;
      }

      const data = await res.json();
      setEvents(data.events);
    } catch (err) {
      setError("Failed to load programs. Please check your connection.");
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
      <div className="font-sans flex flex-col min-h-screen bg-light-beige">
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
              <div className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-nav-dark">Programs</h1>
                <p className="text-foreground/70">Create and manage programs for your organization.</p>
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
              organizationId={organizationId}
            />
            {!isModalOpen && (
              <div className="fixed bottom-8 right-8 z-50">
                <Button
                  variant="default"
                  size="lg"
                  className="cursor-pointer rounded-full h-12 px-6 shadow-2xl hover:shadow-3xl hover:scale-105"
                  onClick={() => setIsModalOpen(true)}
                  aria-label="Create new program"
                  title="Create new program"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline ml-2 font-semibold">New Program</span>
                </Button>
              </div>
            )}
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

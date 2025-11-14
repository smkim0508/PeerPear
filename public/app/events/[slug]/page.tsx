"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PearButton from "@/components/PearButton";
import {
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import PairingResults from "@/components/PairingResults";
import { PairingResultData } from "@/types/events";
import {
  fetchEventById,
  checkUserRegistration,
  registerUserForEvent,
  unregisterUserFromEvent,
  getUserEventResponses,
  getEventParticipants,
  autoTerminateEvent,
  endEvent,
  triggerPairing,
  getEventPairings,
  publishPairings,
} from "@/lib/events";

type Event = {
  id: number;
  organization_id: number;
  created_at: string;
  ends_at: string | null;
  active: boolean;
  title: string | null;
  description: string | null;
  matches: any | null;
  organizations: {
    id: number;
    org_name: string;
    description: string;
  };
  questions: {
    id: number;
    question: string;
    options: any | null;
    event_id: number;
  }[];
};

type UserResponse = {
  id: number;
  question_id: number;
  answer: any | null;
  user_id: number;
};

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default function EventPage({ params }: EventPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [checkedAutoTerminate, setCheckedAutoTerminate] = useState(false);

  // Organization-only section states
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Event editing states
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState({
    title: "",
    description: "",
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Pairing states
  const [pairingData, setPairingData] = useState<PairingResultData | null>(null);
  const [isEndingEvent, setIsEndingEvent] = useState(false);
  const [isTriggeringPairing, setIsTriggeringPairing] = useState(false);
  const [isPublishingPairings, setIsPublishingPairings] = useState(false);
  const [groupSize, setGroupSize] = useState(2);

  const eventId = parseInt(slug);

  // Determine user type - STRICTLY from localStorage only
  const getUserType = (): "student" | "organization" => {
    if (typeof window !== "undefined") {
      const storedUserType = localStorage.getItem("userType") as
        | "student"
        | "organization"
        | null;
      return storedUserType || "student";
    }

    return "student"; // Default to student
  };

  const userType = getUserType();
  const isOrganizationUser = userType === "organization";

  useEffect(() => {
    fetchEvent();
    // Only check registration for students
    if (user?.username && !isOrganizationUser) {
      checkRegistration();
    }
  }, [eventId, user, isOrganizationUser]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!checkedAutoTerminate) {
        setCheckedAutoTerminate(true);
        await autoTerminateEvent(eventId);
      }

      const eventData = await fetchEventById(eventId);
      if (!eventData) {
        setError("Event not found");
        return;
      }
      setEvent(eventData);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!user?.username) return;

    try {
      const isRegistered = await checkUserRegistration(user.username, eventId);
      setIsRegistered(isRegistered);

      if (isRegistered) {
        const responses = await getUserEventResponses(user.username, eventId);
        setUserResponses(responses);

        // Check questionnaire completion status
        if (user?.id) {
          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
          const statusResponse = await fetch(
            `${API_BASE_URL}/event_registration/status/${eventId}/${user.id}`,
            { credentials: "include" }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setQuestionnaireCompleted(statusData.valid_registration || false);
          }
        }
      } else {
        setQuestionnaireCompleted(false);
      }
    } catch (err) {
      console.error("Error checking registration:", err);
    }
  };

  useEffect(() => {
    if (!eventId || !isOrganizationUser) return;

    const fetchParticipants = async () => {
      try {
        const data = await getEventParticipants(eventId);
        setParticipants(data);
        console.log("Participants data:", data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchParticipants();
  }, [eventId, isOrganizationUser]);

  const handleRegister = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    try {
      const result = await registerUserForEvent(user.id!, eventId);

      if (!result.success) {
        // Detect incomplete profile
        if (result.error?.includes("profile")) {
          setError(result.error);
          return;
        }

        setError(result.error || "Failed to register for event");
        return;
      }

      setIsRegistered(true);

      // Set questionnaire completion status
      if (event.questions && event.questions.length > 0) {
        setQuestionnaireCompleted(false); // New registration needs questionnaire
        router.push(`/events/${eventId}/questionnaire`);
      } else {
        setQuestionnaireCompleted(true); // No questionnaire needed
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register for event");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    try {
      const success = await unregisterUserFromEvent(user.username, eventId);

      if (!success) {
        throw new Error("Failed to unregister");
      }

      setIsRegistered(false);
      setUserResponses([]);
      setQuestionnaireCompleted(false);
    } catch (err) {
      console.error("Unregistration error:", err);
      setError("Failed to unregister");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUserClick = async (selectedUser: any) => {
    setSelectedUser(selectedUser);
    setIsModalOpen(true);

    setUserAnswers([]); // Clear previous answers

    try {
      // Get user's responses for this event
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${API_BASE_URL}/questionnaire/${eventId}/${selectedUser.user_id}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match expected format
        const formattedAnswers =
          data.answers?.map((answer: any) => ({
            answer: answer.answer,
            question_id: answer.question_id,
            questions: {
              question:
                data.questions?.find((q: any) => q.id === answer.question_id)
                  ?.question || "",
            },
          })) || [];
        setUserAnswers(formattedAnswers);
      } else {
        console.error("Error fetching user answers:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching user answers:", error);
    }
  };

  const handleEditEvent = () => {
    if (event) {
      setEditEventData({
        title: event.title || "",
        description: event.description || "",
      });
      setIsEditingEvent(true);
    }
  };

  const handleSaveEvent = async () => {
    if (!event) return;

    setIsSavingEvent(true);
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${API_BASE_URL}/organization_dashboard/event?event_id=${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(editEventData),
        }
      );

      if (response.ok) {
        // Update local event state
        setEvent((prev) =>
          prev
            ? {
              ...prev,
              title: editEventData.title,
              description: editEventData.description,
            }
            : null
        );
        setIsEditingEvent(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update event");
      }
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingEvent(false);
    setEditEventData({ title: "", description: "" });
  };

  // Pairing handler functions
  const handleEndEvent = async () => {
    if (!event) return;
    
    setIsEndingEvent(true);
    try {
      const result = await endEvent(eventId);
      if (result.success) {
        // Refresh event to update status
        await fetchEvent();
      } else {
        setError(result.error || "Failed to end event");
      }
    } catch (err) {
      console.error("Error ending event:", err);
      setError("Failed to end event");
    } finally {
      setIsEndingEvent(false);
    }
  };

  const handleTriggerPairing = async () => {
    if (!event) return;
    
    setIsTriggeringPairing(true);
    try {
      const result = await triggerPairing(eventId, groupSize);
      if (result.success && result.data) {
        setPairingData(result.data.pairing_results);
        // Refresh event to update status
        await fetchEvent();
      } else {
        setError(result.error || "Failed to create pairings");
      }
    } catch (err) {
      console.error("Error triggering pairing:", err);
      setError("Failed to create pairings");
    } finally {
      setIsTriggeringPairing(false);
    }
  };

  const handleViewPairings = async () => {
    if (!event) return;
    
    try {
      const result = await getEventPairings(eventId);
      if (result.success && result.data) {
        setPairingData(result.data.pairing_results);
      } else {
        setError(result.error || "Failed to get pairings");
      }
    } catch (err) {
      console.error("Error getting pairings:", err);
      setError("Failed to get pairings");
    }
  };

  const handlePublishPairings = async () => {
    if (!event) return;
    
    setIsPublishingPairings(true);
    try {
      const result = await publishPairings(eventId);
      if (result.success) {
        // Refresh event to update status
        await fetchEvent();
      } else {
        setError(result.error || "Failed to publish pairings");
      }
    } catch (err) {
      console.error("Error publishing pairings:", err);
      setError("Failed to publish pairings");
    } finally {
      setIsPublishingPairings(false);
    }
  };

  // Helper function to get event status for display
  const getEventStatus = () => {
    if (!event) return "Unknown";
    
    // Check if event has ended based on date
    const endDate = event.ends_at ? new Date(event.ends_at) : null;
    const hasDateEnded = endDate ? new Date() > endDate : false;
    
    if (event.active && !hasDateEnded) return "STARTED";
    if (hasDateEnded || (!event.active && event.matches)) return "TERMINATED";
    if (!event.active && !event.matches) return "NOT_STARTED";
    
    return "Unknown";
  };

  const currentStatus = getEventStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Event Error</h2>
            <p className="text-gray-600 mb-4">
              {error || "The event you are looking for does not exist."}
            </p>
            <PearButton
              text="Back to Events"
              onClick={() => router.push("/student")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasQuestions = event.questions && event.questions.length > 0;

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-linear-to-br from-light-beige via-white to-light-beige">
        <Navbar />

        {/* === HERO SECTION === */}
        <div className="relative bg-linear-to-r from-nav-dark to-gray-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8 gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="h-7 w-7 text-green" />
                  <span className="text-green font-bold text-xl">
                    {event.organizations.org_name}
                  </span>
                </div>

                {isEditingEvent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-2xl font-bold text-white">
                        Edit Event Details
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEvent}
                          disabled={
                            isSavingEvent || !editEventData.title.trim()
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <Save className="h-4 w-4" />
                          {isSavingEvent ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingEvent}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          value={editEventData.title}
                          onChange={(e) =>
                            setEditEventData((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full text-3xl lg:text-4xl font-bold leading-tight text-white bg-transparent border-b-2 border-white focus:outline-none focus:border-green-400 transition-colors"
                          placeholder="Enter event title"
                          maxLength={100}
                        />
                        <p className="text-sm text-gray-200 mt-1">
                          {editEventData.title.length}/100 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Event Description
                        </label>
                        <textarea
                          value={editEventData.description}
                          onChange={(e) =>
                            setEditEventData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full text-lg text-gray-100 leading-relaxed bg-transparent border-2 border-white rounded-lg p-4 focus:outline-none focus:border-green-400 resize-none transition-colors"
                          placeholder="Describe your event, its goals, and what participants can expect..."
                          rows={4}
                          maxLength={500}
                        />
                        <p className="text-sm text-gray-200 mt-1">
                          {editEventData.description.length}/500 characters
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-white">
                        {event.title}
                      </h1>
                    </div>
                    {event.description && (
                      <p className="text-lg lg:text-xl text-gray-100 leading-relaxed max-w-4xl">
                        {event.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* === LEFT COLUMN === */}
            <div className="lg:col-span-2 space-y-8">
              {/* About the Organization */}
              <Card className="shadow-lg border-0 bg-white rounded-xl">
                <CardHeader>
                  <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                    <Building2 className="h-7 w-7" />
                    About the Organization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 text-xl leading-relaxed">
                    {event.organizations.description}
                  </p>
                </CardContent>
              </Card>

              {/* Questions Preview */}
              {hasQuestions && (
                <Card className="shadow-lg border-0 bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                      <Users className="h-7 w-7" />
                      Event Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 text-xl mb-6 leading-relaxed">
                      This event includes {event.questions.length} question
                      {event.questions.length !== 1 ? "s" : ""} to help match
                      participants effectively.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* === Participants Section (only for organization) === */}
              {isOrganizationUser && (
                <Card className="shadow-lg border-0 bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                      <Users className="h-7 w-7" />
                      Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {participants.length === 0 ? (
                      <p className="text-gray-600">No participants yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {participants.map((u) => (
                          <div
                            key={u.id}
                            className="cursor-pointer bg-light-beige rounded-xl p-4 hover:bg-[#f0f0e8] transition"
                            onClick={() => handleUserClick(u)}
                          >
                            <h3 className="text-center font-semibold text-lg text-nav-dark">
                              {u.full_name || u.username}
                            </h3>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* === RIGHT SIDEBAR === */}
            <div className="space-y-6">
              {/* Registration section - only for students */}
              {!isOrganizationUser && (
                <Card className="shadow-xl border-0 bg-white top-6 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-nav-dark font-bold">
                      Registration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {isRegistered ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-3 text-green-700 bg-green-50 rounded-xl p-4">
                            <CheckCircle className="h-6 w-6" />
                            <span className="font-bold text-lg">
                              You're registered!
                            </span>
                          </div>

                          {/* Questionnaire Status */}
                          {event?.questions && event.questions.length > 0 && (
                            <div className="space-y-3">
                              <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-semibold text-lg text-nav-dark mb-3">
                                  Questionnaire
                                </h3>
                                {questionnaireCompleted ? (
                                  <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">
                                      Completed
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-orange-700 bg-orange-50 rounded-lg p-3">
                                      <XCircle className="h-5 w-5" />
                                      <span className="font-medium">
                                        Incomplete
                                      </span>
                                    </div>
                                    <PearButton
                                      text="Complete Questionnaire"
                                      onClick={() =>
                                        router.push(
                                          `/events/${eventId}/questionnaire`
                                        )
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                )}
                              </div>

                              {questionnaireCompleted && (
                                <PearButton
                                  text="View/Edit Questionnaire"
                                  onClick={() =>
                                    router.push(
                                      `/events/${eventId}/questionnaire`
                                    )
                                  }
                                  dark
                                  className="w-full"
                                />
                              )}
                            </div>
                          )}

                          <PearButton
                            text={
                              isRegistering ? "Unregistering..." : "Unregister"
                            }
                            onClick={handleUnregister}
                            dark
                            className={`w-full ${isRegistering
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                              }`}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-800 text-lg font-medium">
                            Ready to join this event?
                          </p>
                          <PearButton
                            text={
                              isRegistering ? "Registering..." : "Register Now"
                            }
                            onClick={handleRegister}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Management section - only for organizations */}
              {isOrganizationUser && (
                <Card className="shadow-xl border-0 bg-white top-6 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-nav-dark font-bold">
                      Event Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-gray-800 text-lg font-medium mb-4">
                          Manage your event and view participant responses
                        </p>

                        <div className="grid gap-3">
                          {/* Always available buttons */}
                          {hasQuestions && (
                            <PearButton
                              text="View Response Analytics"
                              onClick={() =>
                                router.push(`/events/${eventId}/questionnaire`)
                              }
                              className="w-full"
                            />
                          )}

                          <PearButton
                            text="Edit Event Details"
                            onClick={handleEditEvent}
                            dark
                            className="w-full"
                          />

                          {/* Event status-specific buttons */}
                          {currentStatus === "STARTED" && (
                            <PearButton
                              text={isEndingEvent ? "Ending Event..." : "End Event"}
                              onClick={handleEndEvent}
                              className="w-full bg-orange-600 hover:bg-orange-700"
                            />
                          )}

                          {currentStatus === "TERMINATED" && (
                            <>
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Group Size
                                </label>
                                <select
                                  value={groupSize}
                                  onChange={(e) => setGroupSize(parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value={2}>Pairs (2 people)</option>
                                  <option value={3}>Groups of 3</option>
                                  <option value={4}>Groups of 4</option>
                                  <option value={5}>Groups of 5</option>
                                </select>
                              </div>
                              
                              <PearButton
                                text={
                                  isTriggeringPairing
                                    ? "Creating Pairings..."
                                    : "Create Pairings"
                                }
                                onClick={handleTriggerPairing}
                                className="w-full bg-green-600 hover:bg-green-700"
                              />

                              {pairingData && (
                                <PearButton
                                  text={
                                    isPublishingPairings
                                      ? "Publishing..."
                                      : "Publish Pairings to Students"
                                  }
                                  onClick={handlePublishPairings}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                />
                              )}
                            </>
                          )}

                          {(currentStatus === "TERMINATED" && event.matches) && (
                            <PearButton
                              text="View Existing Pairings"
                              onClick={handleViewPairings}
                              className="w-full bg-purple-600 hover:bg-purple-700"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pairing Results section - only for organizations with pairing data */}
              {isOrganizationUser && pairingData && (
                <PairingResults pairingData={pairingData} eventId={eventId} />
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* === User Modal (only for organization) === */}
      {isOrganizationUser && isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-[#00000078] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-nav-dark">
                {selectedUser.full_name || selectedUser.username}
              </h2>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Questionnaire Answers
            </h3>
            {userAnswers.length === 0 ? (
              <p className="text-gray-600 text-center">No answers submitted.</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {userAnswers.map((ans, idx) => (
                  <div key={idx} className="bg-light-beige rounded-lg p-4">
                    <p className="font-medium text-nav-dark">
                      {ans.questions.question}
                    </p>
                    <p className="text-gray-700 mt-1">{ans.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

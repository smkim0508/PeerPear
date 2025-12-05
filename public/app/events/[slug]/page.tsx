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
  Trophy,
  Award,
  Timer,
  Bell,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import PairingResults from "@/components/PairingResults";
import { PairingResultData } from "@/types/events";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import {
  fetchEventById,
  checkUserRegistration,
  registerUserForEvent,
  unregisterUserFromEvent,
  getUserEventResponses,
  getEventParticipants,
  autoTerminateEvent,
  startEvent,
  endEvent,
  triggerPairing,
  getEventPairings,
  publishPairings,
  getStudentMatch,
} from "@/lib/events";

function calculateTimeLeft(endTime: string | null) {
  if (!endTime) return null;

  const eventEnd = new Date(endTime).getTime();
  const now = Date.now();
  const diff = eventEnd - now;

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

type Event = {
  id: number;
  organization_id: number;
  created_at: string;
  ends_at: string | null;
  active: boolean;
  status: string;
  title: string | null;
  description: string | null;
  matches: any | null;
  check_sibling_roles: boolean;
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
  image_url?: string | null;
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
  const [userClassYear, setUserClassYear] = useState<string | null>(null);

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
  const [isStartingEvent, setIsStartingEvent] = useState(false);

  // Pairing states
  const [pairingData, setPairingData] = useState<PairingResultData | null>(
    null
  );
  const [isEndingEvent, setIsEndingEvent] = useState(false);
  const [isTriggeringPairing, setIsTriggeringPairing] = useState(false);
  const [isPublishingPairings, setIsPublishingPairings] = useState(false);
  const [groupSize, setGroupSize] = useState(2);

  // Student match states
  const [studentMatch, setStudentMatch] = useState<PairingResultData | null>(
    null
  );
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);

  const eventId = parseInt(slug);

  const [timeLeft, setTimeLeft] = useState<any>(null);

  const [isEditingImage, setIsEditingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmCheckBox, setConfirmCheckbox] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() =>
    Promise.resolve()
  );

  const [confirmYes, setConfirmYes] = useState<string>("");
  const [confirmNo, setConfirmNo] = useState<string>("");

  const pendingRegister = false;

  useEffect(() => {
    if (!event?.ends_at) return;

    const updateTime = () => {
      setTimeLeft(calculateTimeLeft(event.ends_at!));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [event?.ends_at]);

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
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !userType) {
      return;
    }

    const checkAccess = async () => {
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${API_BASE_URL}/events/verify/${eventId}/${userType}`,
          { credentials: "include" }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "You do not have access to view this event");
        }
      } catch (err) {
        console.error("Error verifying access:", err);
        setError("You do not have access to view this event");
      }
    };

    checkAccess();
  }, [eventId, userType]);

  useEffect(() => {
    // Only check registration for students
    if (user?.username && !isOrganizationUser) {
      checkRegistration();
      getUserClassYear();
    }
  }, [user, isOrganizationUser]);

  useEffect(() => {
    // Check for student matches if event has published pairings
    if (
      event &&
      event.status === "PAIRING_PUBLISHED" &&
      user?.id &&
      !isOrganizationUser &&
      isRegistered
    ) {
      fetchStudentMatch();
    }

    // Auto-fetch pairings for organization users
    if (event && event.status === "PAIRING_PUBLISHED" && isOrganizationUser) {
      handleViewPairings();
    }
  }, [event?.status, user?.id, isOrganizationUser, isRegistered]);

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
        setError("Program not found");
        return;
      }
      setEvent(eventData);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load program");
    } finally {
      setIsLoading(false);
    }
  };

  const CountdownCard = () => {
    if (!event?.ends_at || !timeLeft) return null;

    const expired = timeLeft.expired;

    const color = expired
      ? "text-red-700 bg-red-100 border-red-300"
      : timeLeft.days < 2
      ? "text-orange-700 bg-orange-100 border-orange-300"
      : "text-green-700 bg-green-100 border-green-300";

    return (
      <Card className="shadow-xl border-0 bg-white rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-nav-dark font-bold flex items-center gap-2">
            <Timer className="w-6 h-6" />
            Registration Ends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expired ? (
            <div className="text-center p-4 bg-red-50 border border-red-300 rounded-xl">
              <p className="text-red-700 text-xl font-semibold">
                Registration Closed
              </p>
            </div>
          ) : (
            <>
              <div
                className={`text-center p-4 rounded-xl border ${color} transition-all`}
              >
                <p className="font-bold text-lg mb-2">Time Remaining</p>
                <p className="text-2xl font-mono">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
                  {timeLeft.seconds}s
                </p>
              </div>

              <div className="mt-4 text-center text-gray-700">
                <p className="font-medium">Deadline:</p>
                <p className="text-lg font-semibold">
                  {format(parseISO(event.ends_at), "MMMM d, yyyy — h:mm a")}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("File must be an image.");
      return;
    }

    setImageError(null);
    setPreviewImage(URL.createObjectURL(file)); // Temporary preview
  };

  // Save the uploaded image
  const handleImageSave = async () => {
    if (!event) {
      setImageError("Program not loaded yet.");
      return;
    }

    if (!previewImage) {
      setImageError("Please select an image first.");
      return;
    }

    const input = document.getElementById(
      "eventImageUpload"
    ) as HTMLInputElement;
    if (!input?.files?.[0]) return;

    const formData = new FormData();
    formData.append("image", input.files[0]);

    try {
      const res = await fetch(
        `/organization_dashboard/event/image?event_id=${event.id}`,
        { method: "PATCH", body: formData }
      );

      const data = await res.json();

      if (res.ok) {
        setEvent((prev) => ({ ...prev!, image_url: data.image_url }));
        setPreviewImage(null);
        setIsEditingImage(false);
      } else {
        setImageError(data.error || "Failed to upload image.");
      }
    } catch {
      setImageError("Upload failed.");
    }
  };

  // Cancel editing
  const handleCancelEditImage = () => {
    setPreviewImage(null);
    setIsEditingImage(false);
    setImageError(null);
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

  const getUserClassYear = async () => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const statusResponse = await fetch(
        `${API_BASE_URL}/event_registration/class-year`,
        { credentials: "include" }
      );

      const statusData = await statusResponse.json();

      if (statusResponse.ok) {
        setUserClassYear(statusData.class_year || null);
      }
    } catch (err) {
      console.error("Error obtaining student class year:", error);
    }
  };

  useEffect(() => {
    if (!eventId || !isOrganizationUser) return;

    const fetchParticipants = async () => {
      try {
        const data = await getEventParticipants(eventId);
        setParticipants(data);
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchParticipants();
  }, [eventId, isOrganizationUser]);

  const openRegisterModal = () => {
    setConfirmMessage(
      `Before registering, please note that this program uses AI/LLM technology to match participants based on questionnaire responses.`
    );

    setConfirmCheckbox(
      "I understand this program uses AI/LLM technology to match participants."
    );

    setConfirmYes("Register for Event");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handleRegister();
    });
    setConfirmModalOpen(true);
  };

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

        setError(result.error || "Failed to register for program");
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
      setError("Failed to register for program");
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
      setError("Failed to unregister from program");
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

      // First, update text fields
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

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update event");
        setIsSavingEvent(false);
        return;
      }

      // Then, if there's a new image, upload it
      if (previewImage) {
        const input = document.getElementById(
          "eventImageUpload"
        ) as HTMLInputElement;
        if (input?.files?.[0]) {
          const formData = new FormData();
          formData.append("image", input.files[0]);

          const imageRes = await fetch(
            `${API_BASE_URL}/organization_dashboard/event/image?event_id=${eventId}`,
            {
              method: "PATCH",
              body: formData,
              credentials: "include",
            }
          );

          const imageData = await imageRes.json();

          if (imageRes.ok) {
            // Update local event state with new image URL
            setEvent((prev) => ({ ...prev!, image_url: imageData.image_url }));
          } else {
            setError(imageData.error || "Failed to upload image.");
            setIsSavingEvent(false);
            return;
          }
        }
      }

      // Update local event state with new text fields
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              title: editEventData.title,
              description: editEventData.description,
            }
          : null
      );

      // Clean up edit mode
      setIsEditingEvent(false);
      setPreviewImage(null);
      setImageError(null);
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

  const openStartModal = () => {
    setConfirmMessage(`Are you sure you want to start this event?`);

    setConfirmCheckbox(
      "I understand that I cannot edit this event or its questions once I start this event"
    );

    setConfirmYes("Start Event");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handleStartEvent();
    });
    setConfirmModalOpen(true);
  };

  // Start event handler
  const handleStartEvent = async () => {
    if (!event) return;

    setIsStartingEvent(true);
    try {
      const result = await startEvent(eventId);
      if (result.success) {
        // Refresh event to update status
        await fetchEvent();
      } else {
        setError(result.error || "Failed to start event");
      }
    } catch (err) {
      console.error("Error starting event:", err);
      setError("Failed to start event");
    } finally {
      setIsStartingEvent(false);
    }
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

    // Return the status directly from the database
    return event.status;
  };

  const currentStatus = getEventStatus();

  // Fetch student match if pairings are published
  const fetchStudentMatch = async () => {
    if (!event || !user?.id || isOrganizationUser) return;

    setIsLoadingMatch(true);
    try {
      const result = await getStudentMatch(eventId, user.id);
      if (result.success && result.data) {
        setStudentMatch(result.data.pairing_results);
      } else {
        setStudentMatch(null);
      }
    } catch (err) {
      console.error("Error getting student match:", err);
      setStudentMatch(null);
    } finally {
      setIsLoadingMatch(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading program...</p>
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
            <h2 className="text-xl font-semibold mb-2">Program Error</h2>
            <p className="text-gray-600 mb-4">
              {error || "The program you are looking for does not exist."}
            </p>
            <PearButton
              text="Back to Programs"
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
        <Navbar organizationId={event.organization_id} />

        {/* === HERO SECTION === */}
        <div className="relative bg-gradient-to-r from-nav-dark to-gray-800 text-white">
          {/* CONTENT */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* LEFT: Event Details */}
              <div className="space-y-6">
                {/* Organization */}
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-7 w-7 text-green" />
                  <span className="text-green font-bold text-xl">
                    {event.organizations.org_name}
                  </span>

                  {event.check_sibling_roles && (
                    <div className="flex items-center gap-2 before:content-['•'] before:text-green before:text-xl before:mx-1">
                      <Users className="h-7 w-7 text-green" />
                      <span className="text-green font-bold text-xl">
                        Big Sib Little Sib Pairing
                      </span>
                    </div>
                  )}
                </div>

                {/* EDIT / VIEW MODE */}
                {isEditingEvent ? (
                  <div className="space-y-6">
                    {/* Edit Mode Header */}
                    <h2 className="text-2xl font-bold text-white">
                      Edit Program Details
                    </h2>

                    {/* Title */}
                    <div>
                      <label className="block text-white text-sm mb-2">
                        Program Title *
                      </label>
                      <input
                        type="text"
                        value={editEventData.title}
                        onChange={(e) =>
                          setEditEventData({
                            ...editEventData,
                            title: e.target.value,
                          })
                        }
                        className="w-full text-3xl font-bold bg-transparent border-b border-white focus:border-green-400 outline-none pb-1 text-white"
                        maxLength={100}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-white text-sm mb-2">
                        Program Description
                      </label>
                      <textarea
                        value={editEventData.description}
                        onChange={(e) =>
                          setEditEventData({
                            ...editEventData,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full bg-transparent border border-white rounded-lg p-3 text-white focus:border-green-400 outline-none resize-none"
                        maxLength={500}
                      />
                    </div>

                    {/* Upload / Remove Image Buttons */}
                    <div className="flex gap-2 mt-2 items-center">
                      {/* Upload Button */}
                      <div className="space-y-2">
                        <input
                          id="eventImageUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                        <label
                          htmlFor="eventImageUpload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-medium rounded-lg shadow hover:bg-gray-200 cursor-pointer transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-black"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4"
                            />
                          </svg>
                          Upload New Image
                        </label>
                      </div>
                    </div>

                    {/* Display error */}
                    {imageError && (
                      <p className="text-red-400 text-sm mt-1">{imageError}</p>
                    )}

                    {/* Save / Cancel Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveEvent}
                        disabled={isSavingEvent}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingEvent}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* View Mode */}
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                      {event.title}
                    </h1>
                    {event.description && (
                      <p className="text-lg text-gray-200 max-w-2xl leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT: Image Container */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-md sticky top-24">
                  {/* VIEW MODE IMAGE */}
                  {!isEditingEvent && (event.image_url || previewImage) && (
                    <img
                      src={previewImage || event.image_url || ""}
                      className="rounded-xl shadow-lg object-contain w-full"
                      alt="Event"
                    />
                  )}

                  {/* EDIT MODE IMAGE + UPLOAD / REMOVE */}
                  {isEditingEvent && (previewImage || event.image_url) && (
                    <div className="relative">
                      <img
                        src={previewImage || event.image_url || ""}
                        className="rounded-xl shadow-lg object-contain w-full"
                        alt="Program Preview"
                      />
                    </div>
                  )}

                  {isEditingEvent && imageError && (
                    <p className="text-red-400 text-sm mt-1">{imageError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* === LEFT COLUMN === */}
            <div className="lg:col-span-2 space-y-8">
              {/* Published Pairings Section (New Location) */}
              {isOrganizationUser &&
                (currentStatus === "PAIRING_PUBLISHED" ||
                  (currentStatus === "TERMINATED" && pairingData)) && (
                  <Card className="shadow-lg border-2 border-green-100 bg-linear-to-br from-green-50 to-white rounded-xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                          {currentStatus === "PAIRING_PUBLISHED"
                            ? "Published Pairings"
                            : "Pairing Preview"}
                        </CardTitle>
                        <span className="px-4 py-1.5 bg-green-100 text-green-800 text-sm font-bold rounded-full border border-green-200 shadow-xs">
                          {currentStatus === "PAIRING_PUBLISHED"
                            ? "Active"
                            : "Draft"}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 flex-1">
                          <p className="text-gray-800 text-lg font-medium">
                            {currentStatus === "PAIRING_PUBLISHED"
                              ? "Pairings have been successfully published!"
                              : "Review pairings before publishing."}
                          </p>
                          <p className="text-gray-600 leading-relaxed">
                            {currentStatus === "PAIRING_PUBLISHED"
                              ? "All students have been notified of their matches. The complete list of pairings is shown below."
                              : "These matches are not yet visible to students. Review them below and click 'Publish Pairings' when ready."}
                          </p>
                        </div>
                      </div>

                      {/* Pairing Results Content */}
                      <div className="mt-8 border-t border-gray-100 pt-6">
                        {pairingData && (
                          <PairingResults
                            pairingData={pairingData}
                            eventId={eventId}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* About the Organization */}
              <Card className="shadow-lg border-0 bg-white rounded-xl">
                <CardHeader>
                  <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                    <Building2 className="h-7 w-7" /> About the Organization
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
                      <Users className="h-7 w-7" /> Program Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 text-xl mb-6 leading-relaxed">
                      This program includes {event.questions.length} question
                      {event.questions.length !== 1 ? "s" : ""} to help match
                      participants effectively.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Participants Section (only for organization) */}
              {isOrganizationUser && (
                <Card className="shadow-lg border-0 bg-white rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                      <Users className="h-7 w-7" /> Participants
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
              {/* Event Management section - only for organizations */}
              {isOrganizationUser && currentStatus !== "PAIRING_PUBLISHED" && (
                <Card className="shadow-xl border-0 bg-white top-6 rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-nav-dark font-bold">
                      Program Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-gray-800 text-lg font-medium mb-4">
                          Manage your program and view participant responses
                        </p>

                        <div className="grid gap-3">
                          {/* Always available buttons */}
                          {hasQuestions && currentStatus === "STARTED" && (
                            <PearButton
                              text="View Response Analytics"
                              onClick={() =>
                                router.push(`/events/${eventId}/questionnaire`)
                              }
                              className="w-full"
                            />
                          )}

                          {currentStatus === "NOT_STARTED" && (
                            <PearButton
                              text="Edit Event Details"
                              onClick={handleEditEvent}
                              dark
                              className="w-full"
                            />
                          )}

                          {/* Questionnaire management based on event status */}
                          {currentStatus === "NOT_STARTED" && (
                            <PearButton
                              text="Edit Questionnaire"
                              onClick={() =>
                                router.push(`/events/${eventId}/questions`)
                              }
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            />
                          )}

                          {currentStatus === "STARTED" && (
                            <PearButton
                              text="View Questionnaire"
                              onClick={() =>
                                router.push(`/events/${eventId}/questions`)
                              }
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            />
                          )}

                          {/* Event status-specific buttons */}
                          {currentStatus === "NOT_STARTED" && (
                            <PearButton
                              text={
                                isStartingEvent
                                  ? "Starting Event..."
                                  : "Start Event"
                              }
                              onClick={
                                isStartingEvent ? () => {} : openStartModal
                              }
                              className={`w-full bg-green-600 hover:bg-green-700 ${
                                isStartingEvent
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                          )}

                          {currentStatus === "STARTED" && (
                            <PearButton
                              text={
                                isEndingEvent
                                  ? "Ending Program..."
                                  : "End Program"
                              }
                              onClick={
                                isEndingEvent ? () => {} : handleEndEvent
                              }
                              className={`w-full bg-orange-600 hover:bg-orange-700 ${
                                isEndingEvent
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                          )}

                          {currentStatus === "TERMINATED" &&
                            (!event.matches ||
                              (Array.isArray(event.matches) &&
                                event.matches.length === 0)) && (
                              <>
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Group Size
                                  </label>
                                  <select
                                    value={groupSize}
                                    onChange={(e) =>
                                      setGroupSize(parseInt(e.target.value))
                                    }
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
                                  onClick={
                                    isTriggeringPairing
                                      ? () => {}
                                      : handleTriggerPairing
                                  }
                                  className={`w-full bg-green-600 hover:bg-green-700 ${
                                    isTriggeringPairing
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                />

                                {pairingData && (
                                  <PearButton
                                    text={
                                      isPublishingPairings
                                        ? "Publishing..."
                                        : "Publish Pairings to Students"
                                    }
                                    onClick={
                                      isPublishingPairings
                                        ? () => {}
                                        : handlePublishPairings
                                    }
                                    className={`w-full bg-blue-600 hover:bg-blue-700 ${
                                      isPublishingPairings
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }`}
                                  />
                                )}
                              </>
                            )}

                          {currentStatus === "TERMINATED" &&
                            event.matches &&
                            Array.isArray(event.matches) &&
                            event.matches.length > 0 && (
                              <>
                                <PearButton
                                  text="View Existing Pairings"
                                  onClick={handleViewPairings}
                                  className="w-full bg-purple-600 hover:bg-purple-700"
                                />

                                {/* Show publish button if pairings haven't been published yet */}
                                <PearButton
                                  text={
                                    isPublishingPairings
                                      ? "Publishing..."
                                      : "Publish Pairings to Students"
                                  }
                                  onClick={
                                    isPublishingPairings
                                      ? () => {}
                                      : handlePublishPairings
                                  }
                                  className={`w-full bg-blue-600 hover:bg-blue-700 ${
                                    isPublishingPairings
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                />
                              </>
                            )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Your Match (only for students) */}
              {!isOrganizationUser &&
                event?.status === "PAIRING_PUBLISHED" &&
                isRegistered && (
                  <Card className="shadow-xl border-0 bg-white top-6 rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl text-nav-dark font-bold flex items-center gap-2">
                        <Users className="w-6 h-6" /> Your Match
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMatch ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading your match...</p>
                        </div>
                      ) : (studentMatch?.groups?.length ?? 0) > 0 ? (
                        <div className="space-y-4">
                          {studentMatch?.groups?.map((group, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="bg-green-50 border border-green-200 rounded-lg p-4"
                            >
                              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Your Group (
                                {group.students.length} members)
                              </h3>
                              <div className="space-y-3">
                                {group.students.map((student, studentIndex) => (
                                  <div
                                    key={studentIndex}
                                    className={`flex items-center justify-between p-3 rounded-md border ${
                                      student.id === user?.id
                                        ? "bg-blue-100 border-blue-300"
                                        : "bg-white border-gray-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        {student.role === "BIG_SIBLING" ? (
                                          <Trophy className="w-4 h-4 text-yellow-600" />
                                        ) : (
                                          <Award className="w-4 h-4 text-blue-600" />
                                        )}
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            {student.name}{" "}
                                            {student.id === user?.id && "(You)"}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {student.email}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    {event.check_sibling_roles && (
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                                          student.role === "BIG_SIBLING"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            : "bg-blue-100 text-blue-800 border-blue-200"
                                        }`}
                                      >
                                        {student.role === "BIG_SIBLING"
                                          ? "Big Sibling"
                                          : "Little Sibling"}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-600">
                            No match found for this event.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        </div>

        {/* Registration section - only for students */}
        {!isOrganizationUser && event?.status === "STARTED" && (
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
                    {event?.questions?.length > 0 && (
                      <div className="space-y-3">
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="font-semibold text-lg text-nav-dark mb-3">
                            Questionnaire
                          </h3>
                          {questionnaireCompleted ? (
                            <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                              <CheckCircle className="h-5 w-5" />
                              <span className="font-medium">Completed</span>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-center gap-2 text-orange-700 bg-orange-50 rounded-lg p-3">
                                <XCircle className="h-5 w-5" />
                                <span className="font-medium">Incomplete</span>
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
                              router.push(`/events/${eventId}/questionnaire`)
                            }
                            dark
                            className="w-full"
                          />
                        )}
                      </div>
                    )}

                    <PearButton
                      text={isRegistering ? "Unregistering..." : "Unregister"}
                      onClick={handleUnregister}
                      dark
                      className={`w-full ${
                        isRegistering ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 ">
                    <p className="text-gray-800 text-lg font-medium">
                      Ready to join this program?
                    </p>
                    {/* Show Big/Little badge only if event uses sibling roles */}
                    {event.check_sibling_roles && userClassYear && (
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-green" />

                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border 
          ${
            userClassYear === "FRESHMAN" || userClassYear === "SOPHOMORE"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : "bg-yellow-100 text-yellow-800 border-yellow-200"
          }`}
                        >
                          {userClassYear === "FRESHMAN" ||
                          userClassYear === "SOPHOMORE"
                            ? "You are registering as a Little Sibling"
                            : "You are registering as a Big Sibling"}
                        </span>
                      </div>
                    )}

                    <PearButton
                      text={isRegistering ? "Registering..." : "Register Now"}
                      onClick={openRegisterModal}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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
      <ConfirmActionModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        checkbox={confirmCheckBox ? confirmCheckBox : undefined}
        message={confirmMessage}
        confirmText={confirmYes}
        cancelText={confirmNo}
        onConfirm={confirmAction}
      />
    </ProtectedRoute>
  );
}

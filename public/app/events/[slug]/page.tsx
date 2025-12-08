"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import PearButton from "@/components/PearButton";
import ConfirmActionModal from "@/components/ConfirmActionModal";
import PairingResults from "@/components/PairingResults";
import { XCircle } from "lucide-react";

import {
  Timer,
  Users,
  Building2,
  CheckCircle,
  Award,
  Trophy,
  Download,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { PairingResultData } from "@/types/events";
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

function calculateTimeLeft(endTime: string | null) {
  if (!endTime) return null;
  const eventEnd = new Date(endTime).getTime();
  const now = Date.now();
  const diff = eventEnd - now;
  if (diff <= 0)
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default function EventPage2({ params }: EventPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<any>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [userClassYear, setUserClassYear] = useState<string | null>(null);

  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState<{
    title: string;
    description: string;
    image_url: string;
  }>({
    title: "",
    description: "",
    image_url: "",
  });
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isStartingEvent, setIsStartingEvent] = useState(false);

  const [pairingData, setPairingData] = useState<PairingResultData | null>(
    null
  );
  const [isEndingEvent, setIsEndingEvent] = useState(false);
  const [isTriggeringPairing, setIsTriggeringPairing] = useState(false);
  const [isPublishingPairings, setIsPublishingPairings] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [studentMatch, setStudentMatch] = useState<PairingResultData | null>(
    null
  );

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmCheckBox, setConfirmCheckbox] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() =>
    Promise.resolve()
  );
  const [confirmYes, setConfirmYes] = useState<string>("");
  const [confirmNo, setConfirmNo] = useState<string>("");

  const eventId = parseInt(slug);
  const [checkedAutoTerminate, setCheckedAutoTerminate] = useState(false);

  const [eventImage, setEventImage] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const getUserType = (): "student" | "organization" => {
    if (typeof window !== "undefined") {
      const storedUserType = localStorage.getItem("userType") as
        | "student"
        | "organization"
        | null;
      return storedUserType || "student";
    }
    return "student";
  };

  const userType = getUserType();
  const isOrganizationUser = userType === "organization";

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (!event?.ends_at) return;
    const updateTime = () => setTimeLeft(calculateTimeLeft(event.ends_at!));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [event?.ends_at]);

  useEffect(() => {
    if (!eventId || !userType) return;
    const checkAccess = async () => {
      try {
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(
          `${API_BASE_URL}/events/verify/${eventId}/${userType}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!res.ok)
          setError(data.error || "You do not have access to view this event");
      } catch {
        setError("You do not have access to view this event");
      }
    };
    checkAccess();
  }, [eventId, userType]);

  useEffect(() => {
    if (user?.username && !isOrganizationUser) {
      checkRegistration();
      getUserClassYear();
    }
  }, [user, isOrganizationUser]);

  useEffect(() => {
    if (
      event &&
      event.status === "PAIRING_PUBLISHED" &&
      user?.id &&
      !isOrganizationUser &&
      isRegistered
    ) {
      fetchStudentMatch();
    }
    if (event && event.status === "PAIRING_PUBLISHED" && isOrganizationUser) {
      handleViewPairings();
    }
  }, [event?.status, user?.id, isOrganizationUser, isRegistered]);

  useEffect(() => {
    if (!eventId || !isOrganizationUser) return;
    const fetchParticipantsData = async () => {
      try {
        const data = await getEventParticipants(eventId);
        setParticipants(data);
      } catch {}
    };
    fetchParticipantsData();
  }, [eventId, isOrganizationUser]);

  const handleCancelEdit = () => {
    setIsEditingEvent(false);
    setSelectedImageFile(null);
    setImagePreview(null);
    if (!event) return;
    setEditEventData({
      title: event.title || "",
      description: event.description || "",
      image_url: event.image_url || "",
    });
  };

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
    } catch {
      setError("Failed to load program");
    } finally {
      setIsLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!user?.username) return;
    try {
      const registered = await checkUserRegistration(user.username, eventId);
      setIsRegistered(registered);
      if (registered) {
        const responses = await getUserEventResponses(user.username, eventId);
        setUserResponses(responses);
        if (user?.id) {
          const API_BASE_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
          const statusResponse = await fetch(
            `${API_BASE_URL}/event_registration/status/${eventId}/${user.id}`,
            {
              credentials: "include",
            }
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setQuestionnaireCompleted(statusData.valid_registration || false);
          }
        }
      } else {
        setQuestionnaireCompleted(false);
      }
    } catch {}
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
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
      if (statusResponse.ok) setUserClassYear(statusData.class_year || null);
    } catch {}
  };

  const openRegisterModal = () => {
    setConfirmMessage(
      `Before registering, please note that this program uses AI/LLM technology to match participants based on questionnaire responses.`
    );
    setConfirmCheckbox(
      "I understand this program uses AI/LLM technology to match participants."
    );
    setConfirmYes("Register for Program");
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
        setError(result.error || "Failed to register for program");
        return;
      }
      setIsRegistered(true);
      if (event.questions && event.questions.length > 0) {
        setQuestionnaireCompleted(false);
        router.push(`/events/${eventId}/questionnaire`);
      } else {
        setQuestionnaireCompleted(true);
      }
    } catch {
      setError("Failed to register for program");
    } finally {
      setIsRegistering(false);
    }
  };

  const openUnregisterModal = () => {
    setConfirmMessage(`Are you sure you want to unregister from this program?`);
    setConfirmCheckbox("");
    setConfirmYes("Unregister");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handleUnregister();
    });
    setConfirmModalOpen(true);
  };

  const handleUnregister = async () => {
    if (!user || !event) return;
    setIsRegistering(true);
    try {
      const success = await unregisterUserFromEvent(user.username, eventId);
      if (!success) throw new Error("Failed to unregister");
      setIsRegistered(false);
      setUserResponses([]);
      setQuestionnaireCompleted(false);
    } catch {
      setError("Failed to unregister from program");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEditEvent = () => {
    if (event) {
      setEditEventData({
        title: event.title || "",
        description: event.description || "",
        image_url: event.image_url || "",
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
          headers: { "Content-Type": "application/json" },
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
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append("file", selectedImageFile);

        const res = await fetch(`${API_BASE_URL}/events/${eventId}/image`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Failed to upload image");
          return;
        }

        const data = await res.json();
        setEvent((prev) =>
          prev ? { ...prev, image_url: data.image_url } : prev
        );
      }
    } catch {
      setError("Failed to update event");
    } finally {
      setIsSavingEvent(false);
    }
  };

  const openStartModal = () => {
    setConfirmMessage(`Are you sure you want to start this event?`);
    setConfirmCheckbox(
      "I understand that I cannot edit this event or its questions once I start this event"
    );
    setConfirmYes("Start Program");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handleStartEvent();
    });
    setConfirmModalOpen(true);
  };

  const handleStartEvent = async () => {
    if (!event) return;
    setIsStartingEvent(true);
    try {
      const result = await startEvent(eventId);
      if (result.success) await fetchEvent();
      else setError(result.error || "Failed to start event");
    } catch {
      setError("Failed to start event");
    } finally {
      setIsStartingEvent(false);
    }
  };

  const openEndModal = () => {
    setConfirmMessage(`Are you sure you want to end this event?`);
    setConfirmCheckbox(
      "I understand that students cannot register beyond this point"
    );
    setConfirmYes("End Program");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handleEndEvent();
    });
    setConfirmModalOpen(true);
  };

  const handleEndEvent = async () => {
    if (!event) return;
    setIsEndingEvent(true);
    try {
      const result = await endEvent(eventId);
      if (result.success) await fetchEvent();
      else setError(result.error || "Failed to end event");
    } catch {
      setError("Failed to end event");
    } finally {
      setIsEndingEvent(false);
    }
  };

  const openPairingModal = () => {
    setConfirmMessage(`Are you sure you want to make the pairings?`);
    setConfirmCheckbox("I understand that pairing uses LLM/AI");
    setConfirmYes("Make Pairings");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handleTriggerPairing();
    });
    setConfirmModalOpen(true);
  };

  const handleTriggerPairing = async () => {
    if (!event) return;
    setIsTriggeringPairing(true);
    try {
      const result = await triggerPairing(eventId, groupSize);
      if (result.success && result.data) {
        setPairingData(result.data.pairing_results);
        await fetchEvent();
      } else setError(result.error || "Failed to create pairings");
    } catch {
      setError("Failed to create pairings");
    } finally {
      setIsTriggeringPairing(false);
    }
  };

  const handleViewPairings = async () => {
    if (!event) return;
    try {
      const result = await getEventPairings(eventId);
      if (result.success && result.data)
        setPairingData(result.data.pairing_results);
      else setError(result.error || "Failed to get pairings");
    } catch {
      setError("Failed to get pairings");
    }
  };

  const openPublishModal = () => {
    setConfirmMessage(`Are you sure you want to publish these pairings?`);
    setConfirmCheckbox(
      "I understand that students will have access to these pairings"
    );
    setConfirmYes("Publish Pairings");
    setConfirmNo("Cancel");
    setConfirmAction(() => async () => {
      await handlePublishPairings();
    });
    setConfirmModalOpen(true);
  };

  const handlePublishPairings = async () => {
    if (!event) return;
    setIsPublishingPairings(true);
    try {
      const result = await publishPairings(eventId);
      if (result.success) await fetchEvent();
      else setError(result.error || "Failed to publish pairings");
    } catch {
      setError("Failed to publish pairings");
    } finally {
      setIsPublishingPairings(false);
    }
  };

  const fetchStudentMatch = async () => {
    if (!event || !user?.id || isOrganizationUser) return;
    setIsLoadingMatch(true);
    try {
      const result = await getStudentMatch(eventId, user.id);
      if (result.success && result.data)
        setStudentMatch(result.data.pairing_results);
      else setStudentMatch(null);
    } catch {
      setStudentMatch(null);
    } finally {
      setIsLoadingMatch(false);
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

  const handleDownloadPairings = async () => {
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const response = await fetch(
        `${API_BASE_URL}/pairing/event/${eventId}/pairing_txt`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setError("Failed to download pairings");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pairing_results_${eventId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading pairings:", error);
      setError("Failed to download pairings");
    }
  };

  const currentStatus = event ? event.status : "Unknown";
  const hasQuestions = !!event?.questions?.length;

  const hasPairing =
    currentStatus === "TERMINATED" &&
    event &&
    event.matches &&
    Array.isArray(event.matches) &&
    event.matches.length > 0;
  useEffect(() => {
    if (hasPairing) handleViewPairings();
  }, [hasPairing]);

  const CountdownCard = () => {
    if (!event?.ends_at || !timeLeft) return null;
    const expired = timeLeft.expired;
    const color = expired
      ? "text-red-700 bg-red-100 border-red-300"
      : timeLeft.days < 2
      ? "text-orange-700 bg-orange-100 border-orange-300"
      : "text-green bg-green border-green";
    return (
      <Card className="border border-gray bg-white rounded-xl p-5 shadow">
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
              <div className={`text-center p-4 rounded-xl border ${color}`}>
                <p className="font-bold text-lg mb-2 text-white">
                  Time Remaining
                </p>
                <p className="text-2xl font-mono text-white flex justify-center gap-2">
                  <span className="inline-block w-16 text-center">{timeLeft.days}d</span>
                  <span className="inline-block w-12 text-center">{timeLeft.hours}h</span>
                  <span className="inline-block w-14 text-center">{timeLeft.minutes}m</span>
                </p>
              </div>
              <div className="mt-4 text-center text-gray-700">
                <p className="font-medium">Deadline:</p>
                <p className="text-lg font-semibold">
                  {format(parseISO(event.ends_at), "MMMM d, yyyy")}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green mx-auto mb-4"></div>
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
            <h2 className="text-xl font-semibold mb-2">Program Error</h2>
            <p className="text-gray-600 mb-4">
              {error || "The program you are looking for does not exist."}
            </p>
            <PearButton
              text="Back to Programs"
              onClick={() => router.push("/student")}
              className="cursor-pointer"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-light-beige via-white to-light-beige">
        <Navbar organizationId={event.organization_id} />

        <section>
          <div className="relative mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 overflow-hidden">
            {event.image_url && (
              <>
                <div
                  className="absolute inset-0 z-0 opacity-100 bg-cover bg-center bg-no-repeat pointer-events-none w-full!"
                  style={{ backgroundImage: `url(${event.image_url})` }}
                />
                <div className="absolute inset-0 z-0 bg-linear-to-b from-black/30 via-black/10 to-white/40 pointer-events-none" />
              </>
            )}
            <div className="relative z-10 max-w-4xl">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/70 p-6 lg:p-10 space-y-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <Building2 className="h-6 w-6 text-green" />
                  <div className="relative group">
                    <span className="text-green font-semibold text-lg">
                      {event.organizations.org_name}
                    </span>
                    {event.organizations?.description && (
                      <div className="absolute left-0 top-full mt-2 w-72 p-3 rounded-lg border bg-white text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
                        {event.organizations.description}
                      </div>
                    )}
                  </div>
                  <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#f7f7f2] text-nav-dark">
                    {currentStatus === "STARTED"
                      ? "Active"
                      : currentStatus === "TERMINATED"
                      ? "Ended"
                      : currentStatus === "PAIRING_PUBLISHED"
                      ? "Pairings Published"
                      : "Upcoming"}
                  </span>
                </div>

                {isEditingEvent ? (
                  <Card className="border border-gray-200">
                    <CardHeader className="pt-6">
                      <CardTitle className="text-xl">
                        Edit Program Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-6">
                      <div>
                        <label className="block text-sm mb-2">
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
                          className="w-full text-2xl font-bold bg-transparent border-b border-gray-400 focus:border-green outline-none pb-1"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-2">
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
                          className="w-full bg-transparent border border-gray-300 rounded-lg p-3 focus:border-green outline-none"
                          maxLength={500}
                        />
                      </div>
                      {/* Image input and preview */}
                      <div className="flex flex-row items-start gap-6 w-full">
                        <div className="flex-1 min-w-0">
                          <label className="block text-sm font-medium text-gray-700">
                            Event Image
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-gray-500
                                      file:mr-4 file:py-2 file:px-4 file:rounded-full
                                      file:border-0 file:text-sm file:font-semibold
                                      file:bg-primary file:text-white hover:file:bg-gray-400"
                          />
                        </div>
                        {imagePreview && (
                          <div className="w-40 h-40 shrink-0 overflow-hidden rounded-lg border border-gray-200 flex items-center justify-center">
                            <img
                              src={imagePreview}
                              alt="Event Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveEvent}
                          disabled={isSavingEvent}
                          className="px-4 py-2 bg-green text-white rounded hover:bg-green cursor-pointer"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingEvent}
                          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-bold text-nav-dark">
                      {event.title}
                    </h1>
                    {event.description && (
                      <p className="text-lg text-gray-700 max-w-2xl leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
            <div className="space-y-8">
              {isOrganizationUser &&
                (currentStatus === "PAIRING_PUBLISHED" ||
                  (currentStatus === "TERMINATED" && pairingData)) && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pt-6">
                      <CardTitle className="flex items-center gap-3 text-2xl">
                        <CheckCircle className="h-6 w-6 text-green" />
                        {currentStatus === "PAIRING_PUBLISHED"
                          ? "Published Pairings"
                          : "Pairing Preview"}
                      </CardTitle>
                      <span className="px-3 py-1 bg-green text-nav-dark text-xs font-bold rounded-full border border-green">
                        {currentStatus === "PAIRING_PUBLISHED"
                          ? "Active"
                          : "Draft"}
                      </span>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-800 text-lg">
                          {currentStatus === "PAIRING_PUBLISHED"
                            ? "Pairings have been successfully published!"
                            : "Review pairings before publishing."}
                        </p>
                        {pairingData && (
                          <button
                            onClick={handleDownloadPairings}
                            className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-md hover:bg-green/90 transition-colors font-semibold shadow-sm"
                          >
                            <Download className="h-4 w-4" />
                            Export as Text
                          </button>
                        )}
                      </div>
                      <div className="mt-6">
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

              {hasQuestions && (
                <Card>
                  <CardHeader className="flex items-center gap-3 pt-6">
                    <Users className="h-6 w-6 text-green" />
                    <CardTitle className="text-2xl">
                      Program Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <p className="text-gray-800 text-lg">
                      This program includes {event.questions.length} question
                      {event.questions.length !== 1 ? "s" : ""} to help match
                      participants effectively.
                    </p>
                  </CardContent>
                </Card>
              )}
              {isOrganizationUser && (
                <Card>
                  <CardHeader className="flex items-center gap-3 pt-6">
                    <Users className="h-6 w-6 text-green" />
                    <CardTitle className="text-2xl">Participants</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {participants.length === 0 ? (
                      <p className="text-gray-600">No participants yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {participants.map((u) => (
                          <div
                            key={u.id}
                            className="cursor-pointer rounded-xl p-4 border border-gray-200 hover:bg-[#f7f7f2] transition"
                            onClick={() => {
                              handleUserClick(u);
                            }}
                          >
                            <p className="text-center font-semibold text-lg text-nav-dark">
                              {u.full_name || u.username}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {!isOrganizationUser &&
                event?.status === "PAIRING_PUBLISHED" &&
                isRegistered && (
                  <Card>
                    <CardHeader className="flex items-center gap-2 pt-4">
                      <Users className="w-5 h-5" />
                      <CardTitle className="text-2xl">Your Match</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMatch ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading your match...</p>
                        </div>
                      ) : (studentMatch?.groups?.length ?? 0) > 0 ? (
                        <div className="space-y-4">
                          {studentMatch?.groups?.map((group, groupIndex) => (
                            <div key={groupIndex} className="p-4">
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
            <div className="space-y-6">
              {!isOrganizationUser && event?.status === "STARTED" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl mt-4">Registration</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {isRegistered ? (
                      !event?.questions?.length || questionnaireCompleted ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-3 text-green bg-green rounded-xl p-4">
                            <CheckCircle className="h-6 w-6 text-white" />
                            <span className="font-bold text-lg text-white text-center">
                              You're registered!
                            </span>
                          </div>

                          {event?.questions?.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="font-semibold text-lg">Questionnaire Status</h3>
                              <div className="flex items-center gap-2 text-green">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Completed</span>
                              </div>
                            </div>
                          )}
                          <PearButton
                            text={isRegistering ? "Unregistering..." : "Unregister"}
                            onClick={isRegistering ? () => {} : openUnregisterModal}
                            className={`cursor-pointer w-full bg-red-400 hover:bg-red-500 ${
                              isRegistering ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-3 text-blue-700 bg-blue-100 border-2 border-blue-300 rounded-xl p-4">
                            <span className="font-bold text-lg text-blue-700 text-center">
                              Questionnaire Incomplete
                            </span>
                          </div>
                          {event?.questions?.length > 0 && (
                            <div className="space-y-3">
                              <h3 className="font-semibold text-lg">Questionnaire Status</h3>
                              <div className="space-y-3">
                                <p className="text-gray-700">
                                  You are not eligible for a match until you complete the questionnaire below.
                                </p>
                                <PearButton
                                  text="Go to Questionnaire"
                                  onClick={() => router.push(`/events/${eventId}/questionnaire`)}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}

                          {event.status === "STARTED" && (
                            <PearButton
                              text={isRegistering ? "Unregistering..." : "Unregister"}
                              onClick={isRegistering ? () => {} : openUnregisterModal}
                              className={`cursor-pointer w-full bg-red-400 hover:bg-red-500 mt-2 ${
                                isRegistering ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            />
                          )}
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-700">Register to participate in this program.</p>
                        <PearButton
                          text={isRegistering ? "Registering..." : "Register"}
                          onClick={isRegistering ? () => {} : openRegisterModal}
                          className={`w-full bg-green mb-4 cursor-pointer ${
                            isRegistering ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {currentStatus === "STARTED" && <CountdownCard />}
              {isOrganizationUser && currentStatus !== "PAIRING_PUBLISHED" && (
                <Card>
                  <CardHeader className="pt-6">
                    <CardTitle className="text-2xl">
                      Program Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="grid gap-3">
                      {hasQuestions && currentStatus === "STARTED" && (
                        <PearButton
                          text="View Response Analytics"
                          onClick={() =>
                            router.push(`/events/${eventId}/questionnaire`)
                          }
                          className="w-full cursor-pointer py-6"
                        />
                      )}
                      {currentStatus === "NOT_STARTED" && (
                        <PearButton
                          text="Edit Program Details"
                          onClick={handleEditEvent}
                          className="w-full cursor-pointer py-6"
                        />
                      )}
                      {currentStatus === "NOT_STARTED" && (
                        <PearButton
                          text="Edit Questionnaire"
                          onClick={() =>
                            router.push(`/events/${eventId}/questions`)
                          }
                          className="w-full cursor-pointer bg-blue-400 hover:bg-blue-500 py-6"
                        />
                      )}
                      {currentStatus === "STARTED" && (
                        <PearButton
                          text="View Questionnaire"
                          onClick={() =>
                            router.push(`/events/${eventId}/questions`)
                          }
                          className="w-full cursor-pointer bg-blue-400 hover:bg-blue-500 py-6"
                        />
                      )}
                      {currentStatus === "NOT_STARTED" && (
                        <PearButton
                          text={
                            isStartingEvent
                              ? "Starting Program..."
                              : "Start Program"
                          }
                          onClick={isStartingEvent ? () => {} : openStartModal}
                          className={`w-full bg-green-600 hover:bg-green-700 ${
                            isStartingEvent
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          } cursor-pointer py-6`}
                        />
                      )}
                      {currentStatus === "STARTED" && (
                        <PearButton
                          text={
                            isEndingEvent ? "Ending Program..." : "End Program"
                          }
                          onClick={isEndingEvent ? () => {} : openEndModal}
                          className={`w-full bg-red-400 hover:bg-red-500 ${
                            isEndingEvent ? "opacity-50 cursor-not-allowed" : ""
                          } cursor-pointer py-6`}
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
                                  : openPairingModal
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
                                    : openPublishModal
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
                              text={
                                isPublishingPairings
                                  ? "Publishing..."
                                  : "Publish Pairings to Students"
                              }
                              onClick={
                                isPublishingPairings
                                  ? () => {}
                                  : openPublishModal
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
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {isOrganizationUser && isModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-[#00000078] flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-xl relative">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
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
                <p className="text-gray-600 text-center">
                  No answers submitted.
                </p>
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
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import PearButton from "@/components/PearButton";
import {
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  organizations: Database["public"]["Tables"]["organizations"]["Row"];
  questions: Database["public"]["Tables"]["questions"]["Row"][];
};

type UserResponse = Database["public"]["Tables"]["responses"]["Row"];

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const eventId = parseInt(slug);

  useEffect(() => {
    fetchEvent();
  }, [eventId, user]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select(
          `
          *,
          organizations (
            id,
            org_name,
            description
          ),
          questions (
            id,
            question,
            options,
            event_id
          )
        `
        )
        .eq("id", eventId)
        .single();

      if (eventError) {
        setError("Event not found");
        return;
      }

      setEvent(eventData as Event);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url")
        .contains("events", [eventId]); 

      if (!error && data) {
        setParticipants(data);
      } else {
        console.error("Error fetching participants:", error);
      }
    };

    fetchParticipants();
  }, [eventId]);

  const handleRegister = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, events")
        .eq("username", user.username)
        .single();

      if (userError) throw new Error("User not found");

      const updatedEvents = [...(userData.events || []), eventId];

      const { error: updateError } = await supabase
        .from("users")
        .update({ events: updatedEvents })
        .eq("id", userData.id);

      if (updateError) throw new Error("Failed to register");

      setIsRegistered(true);

      if (event.questions && event.questions.length > 0) {
        router.push(`/events/${eventId}/questionnaire`);
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
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, events")
        .eq("username", user.username)
        .single();

      if (userError) throw new Error("User not found");

      const updatedEvents = (userData.events || []).filter(
        (id: number) => id !== eventId
      );

      const { error: updateError } = await supabase
        .from("users")
        .update({ events: updatedEvents })
        .eq("id", userData.id);

      if (updateError) throw new Error("Failed to unregister");

      setIsRegistered(false);
      setUserResponses([]);
    } catch (err) {
      console.error("Unregistration error:", err);
      setError("Failed to unregister");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUserClick = async (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);

    const { data, error } = await supabase
      .from("responses")
      .select(`
        answer,
        question_id,
        questions (question)
      `)
      .eq("user_id", user.id)
      .eq("event_id", eventId);

    if (!error && data) {
      setUserAnswers(data);
    } else {
      console.error("Error fetching user answers:", error);
    }
  };

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
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
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

  const isEventActive = event.active;
  const hasEnded = event.end_date
    ? new Date(event.end_date) < new Date()
    : false;
  const hasQuestions = event.questions && event.questions.length > 0;
  const hasCompletedQuestionnaire =
    hasQuestions && userResponses.length > 0;

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
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white">
                  {event.title}
                </h1>
                {event.description && (
                  <p className="text-lg lg:text-xl text-gray-100 leading-relaxed max-w-4xl">
                    {event.description}
                  </p>
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

              {/* Participants Section */}
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
                          <img
                            src={u.avatar_url || "/default-avatar.png"}
                            alt={u.username}
                            className="w-16 h-16 rounded-full mx-auto mb-3"
                          />
                          <h3 className="text-center font-semibold text-lg text-nav-dark">
                            {u.full_name || u.username}
                          </h3>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* === RIGHT SIDEBAR === */}
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white top-6 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-nav-dark font-bold">
                    Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="text-center">
                    {isRegistered ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-green-700 bg-green-50 rounded-xl p-4">
                          <CheckCircle className="h-6 w-6" />
                          <span className="font-bold text-lg">
                            You're registered!
                          </span>
                        </div>

                        <PearButton
                          text={
                            isRegistering ? "Unregistering..." : "Unregister"
                          }
                          onClick={handleUnregister}
                          dark
                          className={`w-full ${
                            isRegistering
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
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* User Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <div className="text-center mb-6">
              <img
                src={selectedUser.avatar_url || "/default-avatar.png"}
                alt={selectedUser.username}
                className="w-20 h-20 rounded-full mx-auto mb-3"
              />
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
    </ProtectedRoute>
  );
}

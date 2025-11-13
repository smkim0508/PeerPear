"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import PearButton from "@/components/PearButton";
import { Calendar, Clock, Users, Building2, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

type Event = Database['public']['Tables']['events']['Row'] & {
  organizations: Database['public']['Tables']['organizations']['Row'];
  questions: Database['public']['Tables']['questions']['Row'][];
};

type UserResponse = Database['public']['Tables']['responses']['Row'];

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

  const eventId = parseInt(slug);

  useEffect(() => {
    fetchEvent();
  }, [eventId, user]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch event with organization details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
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
        `)
        .eq('id', eventId)
        .single();

      console.log("eventData", eventData);

      if (eventError) {
        console.error('Error fetching event:', eventError);
        setError('Event not found');
        return;
      }

      setEvent(eventData as Event);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    try {
      // Get user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, events')
        .eq('username', user.username)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      // Add event to user's events array
      const updatedEvents = [...(userData.events || []), eventId];

      const { error: updateError } = await supabase
        .from('users')
        .update({ events: updatedEvents })
        .eq('id', userData.id);

      if (updateError) {
        throw new Error('Failed to register for event');
      }

      setIsRegistered(true);

      // Redirect to questionnaire if there are questions
      if (event.questions && event.questions.length > 0) {
        router.push(`/events/${eventId}/questionnaire`);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register for event');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    try {
      // Get user ID first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, events')
        .eq('username', user.username)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      // Remove event from user's events array
      const updatedEvents = (userData.events || []).filter((id: number) => id !== eventId);

      const { error: updateError } = await supabase
        .from('users')
        .update({ events: updatedEvents })
        .eq('id', userData.id);

      if (updateError) {
        throw new Error('Failed to unregister from event');
      }

      setIsRegistered(false);
      setUserResponses([]);
    } catch (err) {
      console.error('Unregistration error:', err);
      setError('Failed to unregister from event');
    } finally {
      setIsRegistering(false);
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
            <p className="text-gray-600 mb-4">{error || 'The event you are looking for does not exist.'}</p>
            <PearButton text="Back to Events" onClick={() => router.push('/student')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEventActive = event.active;
  const hasEnded = event.end_date ? new Date(event.end_date) < new Date() : false;
  const hasQuestions = event.questions && event.questions.length > 0;
  const hasCompletedQuestionnaire = hasQuestions && userResponses.length > 0;

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-linear-to-br from-light-beige via-white to-light-beige">
        <Navbar />

        {/* Hero Section */}
        <div className="relative bg-linear-to-r from-nav-dark to-gray-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8 gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="h-7 w-7 text-green" />
                  <span className="text-green font-bold text-xl">{event.organizations.org_name}</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight text-white">{event.title}</h1>
                {event.description && (
                  <p className="text-lg lg:text-xl text-gray-100 leading-relaxed max-w-4xl">{event.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEventActive ? (
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-green text-nav-dark text-base font-bold shadow-lg">
                    <CheckCircle className="h-5 w-5" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gray-500 text-white text-base font-medium shadow-lg">
                    <XCircle className="h-5 w-5" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Key Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {event.start_date && (
                <div className="flex items-center gap-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <Calendar className="h-10 w-10 text-nav-dark shrink-0" />
                  <div>
                    <p className="text-nav-dark font-bold text-sm uppercase tracking-wide mb-1">Created</p>
                    <p className="text-gray-700 text-lg font-semibold">{format(parseISO(event.start_date), 'PPP')}</p>
                  </div>
                </div>
              )}

              {event.end_date && (
                <div className="flex items-center gap-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <Clock className="h-10 w-10 text-nav-dark shrink-0" />
                  <div>
                    <p className="text-nav-dark font-bold text-sm uppercase tracking-wide mb-1">Ends</p>
                    <p className="text-gray-700 text-lg font-semibold">{format(parseISO(event.end_date), 'PPP p')}</p>
                  </div>
                </div>
              )}

              {hasQuestions && (
                <div className="flex items-center gap-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                  <Users className="h-10 w-10 text-nav-dark shrink-0" />
                  <div>
                    <p className="text-nav-dark font-bold text-sm uppercase tracking-wide mb-1">Questions</p>
                    <p className="text-gray-700 text-lg font-semibold">{event.questions.length} Question{event.questions.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Organization Info */}
              <Card className="shadow-lg border-0 bg-white rounded-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                    <Building2 className="h-7 w-7" />
                    About the Organization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 text-xl leading-relaxed">{event.organizations.description}</p>
                </CardContent>
              </Card>

              {/* Questions Preview */}
              {hasQuestions && (
                <Card className="shadow-lg border-0 bg-white rounded-xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-3xl text-nav-dark flex items-center gap-3 font-bold">
                      <Users className="h-7 w-7" />
                      Event Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 text-xl mb-6 leading-relaxed">
                      This event includes {event.questions.length} question{event.questions.length !== 1 ? 's' : ''} to help with pairing participants effectively.
                    </p>
                    <div className="bg-light-beige rounded-xl p-6">
                      <p className="text-base text-gray-700 leading-relaxed">
                        After registration, you'll be able to complete the questionnaire to provide information for better matching with other participants.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Registration Card */}
              <Card className="shadow-xl border-0 bg-white top-6 rounded-xl">
                <CardHeader className="rounded-t-xl">
                  <CardTitle className="text-2xl text-nav-dark font-bold">Registration</CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      {isRegistered ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-3 text-green-700 bg-green-50 rounded-xl p-4">
                            <CheckCircle className="h-6 w-6" />
                            <span className="font-bold text-lg">You're registered!</span>
                          </div>

                          {hasQuestions && (
                            <div className="bg-light-beige rounded-xl p-4">
                              <p className="text-base text-gray-800 mb-3">
                                Questionnaire: {hasCompletedQuestionnaire ?
                                  <span className="text-green-600 font-bold">Completed ✓</span> :
                                  <span className="text-orange-600 font-bold">Pending</span>
                                }
                              </p>
                              {!hasCompletedQuestionnaire && (
                                <PearButton
                                  text="Complete Questionnaire"
                                  onClick={() => router.push(`/events/${eventId}/questionnaire`)}
                                  className="w-full"
                                />
                              )}
                            </div>
                          )}

                          <PearButton
                            text={isRegistering ? "Unregistering..." : "Unregister"}
                            onClick={handleUnregister}
                            dark
                            className={`w-full ${isRegistering ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-800 text-lg font-medium">Ready to join this event?</p>
                          <PearButton
                            text={isRegistering ? "Registering..." : "Register Now"}
                            onClick={handleRegister}
                            className={`w-full ${(!isEventActive || hasEnded || isRegistering) ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                          {(!isEventActive || hasEnded) && (
                            <p className="text-base text-red-600 mt-3 font-medium">
                              {hasEnded ? "This event has ended" : "This event is not currently active"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Status Card */}
              <Card className="shadow-lg border-0 bg-white rounded-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-nav-dark font-bold">Event Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 text-base font-medium">Status</span>
                    <span className={`font-bold text-base ${isEventActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {isEventActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {event.start_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 text-base font-medium">Created</span>
                      <span className="font-bold text-base text-gray-800">{format(parseISO(event.start_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  {event.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 text-base font-medium">Ends</span>
                      <span className="font-bold text-base text-gray-800">{format(parseISO(event.end_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  {hasQuestions && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 text-base font-medium">Questions</span>
                      <span className="font-bold text-base text-gray-800">{event.questions.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
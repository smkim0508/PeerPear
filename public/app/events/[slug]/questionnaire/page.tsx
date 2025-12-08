"use client";
import Navbar from "@/components/Navbar";
import PearButton from "@/components/PearButton";
import PearQuestion from "@/components/PearQuestion";
import ResponseVisualization from "@/components/ResponseVisualization";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { use, useEffect, useState } from "react";
import { PearAlert } from "@/components/PearAlert";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { fetchEventById } from "@/lib/events";

interface QuestionnairePageProps {
  params: Promise<{ slug: string }>;
}

function validateAnswers(questions: any[], answers: Record<number, string>) {
  const invalidAnswers = [];

  for (const [index, q] of questions.entries()) {
    const question_id = q.id;
    const value = answers[question_id];

    if (!value || value.trim() === "") {
      invalidAnswers.push(index + 1);
      continue;
    }

    if (q.options && q.options.length > 0 && !q.options.includes(value)) {
      invalidAnswers.push(index + 1);
    }
  }

  return invalidAnswers;
}

export default function QuestionnairePage({ params }: QuestionnairePageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [validRegistration, setValidRegistration] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const event_id = parseInt(slug);
  const user_id = user?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // Organization-specific state
  const [participants, setParticipants] = useState<any[]>([]);
  const [allResponses, setAllResponses] = useState<any[]>([]);

  // Determine user type - STRICTLY from localStorage only
  const getUserType = (): "student" | "organization" => {
    if (typeof window !== 'undefined') {
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

  const handleAnswerChange = (questionId: number, newValue: string) => {
    if (isReadOnly) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: newValue,
    }));
  };

  const fetchParticipantsAndResponses = async () => {
    try {
      // Fetch participants for this event (use existing endpoint)
      const participantsRes = await fetch(`${apiUrl}/events/${event_id}/participants`, {
        credentials: "include",
      });

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData);

        // Fetch all responses for all participants
        const responsePromises = participantsData.map(async (participant: any) => {
          try {
            const responseRes = await fetch(`${apiUrl}/questionnaire/${event_id}/${participant.user_id}`, {
              credentials: 'include',
            });

            if (responseRes.ok) {
              const responseData = await responseRes.json();
              return responseData.answers || [];
            }
            return [];
          } catch (err) {
            return [];
          }
        });

        const allResponsesArrays = await Promise.all(responsePromises);
        const flattenedResponses = allResponsesArrays.flat();
        setAllResponses(flattenedResponses);
      }
    } catch (err) {
    }
  };

  const get_questions = async () => {
    try {
      const res = await fetch(`${apiUrl}/questionnaire/${event_id}/${user_id}`, {
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);

        // For students, load their existing answers
        if (!isOrganizationUser) {
          const normalizedAnswers: Record<number, string> = (
            data.answers || []
          ).reduce(
            (
              acc: Record<number, string>,
              item: { question_id: number; answer: string }
            ) => {
              acc[item.question_id] = item.answer;
              return acc;
            },
            {}
          );
          setAnswers(normalizedAnswers);
        }
      } else {
        setError(data.error || "Failed to load questions");
      }
    } catch (err) {
      setError("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkEventStatus = async () => {
      if (!event_id) return;
      const event = await fetchEventById(event_id);
      if (event) {
        if (event.status === "TERMINATED" || event.status === "PAIRING_PUBLISHED") {
          setIsReadOnly(true);
        }
      }
    };

    const verify_registration = async () => {
      if (!user_id) {
        return;
      }

      await checkEventStatus();

      // For organization users, skip registration check and load questions directly
      if (isOrganizationUser) {
        await get_questions();
        await fetchParticipantsAndResponses();
        return;
      }

      // For student users, check registration status
      try {
        const res = await fetch(
          `${apiUrl}/event_registration/status/${event_id}/${user_id}`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();
        if (!res.ok || !data.registered) {
          router.push(`/events/${event_id}`);
          return;
        }

        setValidRegistration(data.valid_registration);
        await get_questions();
      } catch (err) {
        // Even if registration check fails, try to load questions
        await get_questions();
      }
    };

    if (event_id && !isNaN(event_id) && user_id) {
      verify_registration();
    } else if (!user_id && user === null) {
      // User is not authenticated, redirect to login
      router.push(`/events/${event_id}`);
    } else if (isNaN(event_id)) {
      setError("Invalid program ID");
      setLoading(false);
    }
  }, [event_id, user_id, apiUrl, router, user, isOrganizationUser]);



  const handleSubmit = async () => {
    if (isReadOnly) return;

    if (!user_id) {
      setAlert({
        type: "error",
        message: "User not authenticated. Please log in and try again.",
      });
      return;
    }

    if (!termsAccepted) {
      setAlert({
        type: "error",
        message: "You must accept the terms and conditions to proceed.",
      });
      return;
    }

    // Validate answers
    const invalidQuestions = validateAnswers(questions, answers);
    if (invalidQuestions.length > 0) {
      setAlert({
        type: "error",
        message: `Please answer all required questions. Missing responses for question(s): ${invalidQuestions.join(", ")}`,
      });
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/questionnaire/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          event_id,
          user_id,
          answers: Object.entries(answers).map(([question_id, answer]) => ({
            question_id: parseInt(question_id),
            answer,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (!validRegistration) {
          handleValidateRegistration();
        }
        setAlert({
          type: "success",
          message: "Questionnaire submitted successfully!",
        });
        setTimeout(() => {
          router.push(`/events/${event_id}`);
        }, 2000);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Failed to submit questionnaire.",
        });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: "Server error. Please try again later.",
      });
    }
  };

  const handleValidateRegistration = async () => {
    try {
      const res = await fetch(`${apiUrl}/event_registration/mark-valid`, {
        credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id, user_id }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to mark registration valid:", data.error);
        setAlert({
          type: "error",
          message: "Failed to finalize registration status.",
        });
        return;
      }

      setValidRegistration(true);
    } catch (err) {
      setAlert({
        type: "error",
        message: "Server error finalizing registration.",
      });
    }
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <>
      <Navbar userType={userType} />
      <div className="min-h-screen bg-[#EBECE4]">
        <div className="flex flex-col items-center p-6 pt-12">
          <div className="w-full max-w-6xl mb-4">
            <button
              onClick={() => router.push(`/events/${event_id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Program
            </button>
          </div>
          <div className="text-center mb-8 max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {isOrganizationUser ? "Program Responses" : isReadOnly ? "Your Questionnaire Responses" : "Questionnaire Form"}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-3">
              {isOrganizationUser
                ? "View all participant responses for this program."
                : isReadOnly
                  ? "View the responses you submitted for this program."
                  : "Help us find the perfect peer match for you by answering a few questions about your preferences and goals."}
            </p>
            {alert && <PearAlert type={alert.type} message={alert.message} />}
          </div>

          {isOrganizationUser ? (
            // Organization view - Show all responses
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-8 md:p-12">
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading responses...</p>
                  </div>
                ) : error ? (
                  <div className="text-center">
                    <h3 className="text-red-500 text-xl mb-4">{error}</h3>
                    <PearButton
                      text="Back to Program"
                      onClick={() => router.push(`/events/${event_id}`)}
                    />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-xl">No questionnaire has been set up for this program.</p>
                    <PearButton
                      text="Back to Program"
                      onClick={() => router.push(`/events/${event_id}`)}
                      className="mt-4"
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-8">
                      {questions.map((question, qIndex) => (
                        <ResponseVisualization
                          key={question.id}
                          question={question}
                          participants={participants}
                          allResponses={allResponses}
                          questionIndex={qIndex}
                        />
                      ))}
                    </div>

                    <div className="text-center pt-8">
                      <PearButton
                        text="Back to Program"
                        onClick={() => router.push(`/events/${event_id}`)}
                        dark
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Student view - Questionnaire form
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="p-8 md:p-12">
                <div className="space-y-8">
                  {loading ? (
                    <h3>Loading questions...</h3>
                  ) : error ? (
                    <h3 className="text-red-500">{error}</h3>
                  ) : (
                    questions.map((q, index) => (
                      <PearQuestion
                        key={q.id}
                        questionId={q.id}
                        question={q.question}
                        number={index + 1}
                        type={q.options?.length ? "radio" : "textarea"}
                        options={q.options || []}
                        value={answers[q.id] || ""}
                        onChange={handleAnswerChange}
                        disabled={isReadOnly}
                      />
                    ))
                  )}

                  {!loading && !error && questions.length > 0 && !isReadOnly && (
                    <div className="border-t border-gray-200 pt-8 mt-8">
                      <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                          By submitting this questionnaire, you agree to be matched
                          with a peer based on your responses and participate in the
                          event activities.
                        </p>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={termsAccepted}
                            onCheckedChange={(checked) =>
                              setTermsAccepted(!!checked)
                            }
                            id="terms"
                          />
                          <Label
                            htmlFor="terms"
                            className="text-sm font-medium cursor-pointer"
                          >
                            I accept the terms and conditions
                          </Label>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <PearButton
                          onClick={handleSubmit}
                          text={
                            validRegistration
                              ? "Update Questionnaire"
                              : "Submit Questionnaire"
                          }
                          className="px-8 py-6 text-lg font-semibold min-w-[200px] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {isReadOnly && (
                    <div className="text-center pt-8">
                      <p className="text-gray-600 mb-4">
                        This questionnaire is closed for editing.
                      </p>
                      <PearButton
                        text="Back to Program"
                        onClick={() => router.push(`/events/${event_id}`)}
                        dark
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
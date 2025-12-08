"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { PearAlert } from "@/components/PearAlert";
import PearButton from "@/components/PearButton";
import PearForm from "@/components/PearForm";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowLeft, Plus, X } from "lucide-react";
import { Squiggle } from "@/components/ui/Squiggle";
import { Button } from "@/components/ui/button";

interface QuestionnairePageProps {
  params: Promise<{ slug: string }>;
}

interface EventInfo {
  id: number;
  title: string;
  description: string;
  organization_name: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
}

interface Question {
  id: number;
  question: string;
  type?: "text" | "multiple_choice";
  options?: string[];
}

interface Organization {
  id: number;
  org_name: string;
  description: string;
}

export default function EventQuestionsPage({ params }: QuestionnairePageProps) {
  const { slug } = use(params);
  const { user } = useAuth();
  const event_id = parseInt(slug);
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [edit, setEdit] = useState(false);
  const [view, setView] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [eventStatus, setEventStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    fetchOrganization();
    fetchEventStatus();
  }, [event_id]);

  useEffect(() => {
    fetchPermissions();
  }, [event_id]);

  const fetchOrganization = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/events/${event_id}/organization`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOrganization(data.organization || null);
      } else {
        setError(data.error || "Failed to load organization.");
      }
    } catch (err) {
      setError("Server error fetching organization.");
    } finally {
      setOrgLoading(false);
    }
  };

  const fetchEventStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/events/${event_id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEventStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch event status", err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(
        `${apiUrl}/question_management/verification/${event_id}`,
        {
          credentials: "include", // Include cookies for authentication
        }
      );
      const data = await res.json();
      if (res.ok) {
        setEdit(data.canEdit);
        setView(data.canView);
      } else {
        console.error("error verifying user", data.error);
        setView(false);
        setEdit(false);
      }
    } catch (err) {
      console.error("error verifying user", err);
      setView(false);
      setEdit(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

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

  const fetchQuestions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/question_management/${event_id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
      } else {
        setError(data.error || "Failed to load questions.");
      }
    } catch (err) {
      setError("Server error fetching questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (data: {
    id?: number;
    question: string;
    type: "text" | "multiple_choice";
    options?: string[];
  }) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

      let res;
      if (data.id) {
        //Endpoint is: /update-question/<question_id>
        res = await fetch(
          `${apiUrl}/question_management/update-question/${data.id}`,
          {
            method: "PATCH",
            credentials: "include",

            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question: data.question,
              options: data.type === "multiple_choice" ? data.options : [],
            }),
          }
        );
      } else {
        //Endpoint is:  POST /create-question
        res = await fetch(`${apiUrl}/question_management/create-question`, {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: event_id,
            question: data.question,
            options: data.type === "multiple_choice" ? data.options : [],
          }),
        });
      }

      const result = await res.json();

      if (res.ok) {
        setSuccessMessage(
          data.id
            ? "Question updated successfully!"
            : "Question added successfully!"
        );
        setShowAddForm(false);
        fetchQuestions();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Failed to save question.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Server error saving question.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      //Endpoint is:
      //  DELETE /delete-question/<question_id>
      const res = await fetch(
        `${apiUrl}/question_management/delete-question/${questionId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (res.ok) {
        setSuccessMessage("Question deleted successfully!");
        fetchQuestions();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Failed to delete question.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("Server error deleting question.");
      setTimeout(() => setError(null), 3000);
    }
  };

  if (permissionsLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  if (!view || userType == "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Program Access Error</h2>
            <p className="text-gray-600 mb-4">
              You are not able to view this Program
            </p>
            <PearButton
              text="Back to Programs"
              onClick={() => router.push("/organization")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEditingDisabled =
    eventStatus === "TERMINATED" || eventStatus === "PAIRING_PUBLISHED";

  return (
    <>
      <Navbar userType="organization" organizationId={organization?.id} />
      <div className="min-h-screen  p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push(`/events/${event_id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Program
            </button>
          </div>

          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-full mb-3">
              <h1 className="text-6xl md:text-7xl font-bold text-nav-dark tracking-tight mb-3">
                Questionnaire Page
              </h1>
              {organization && (
                <h2 className="text-3xl font-bold text-primary mx-auto leading-relaxed">
                  {organization.org_name}
                </h2>
              )}
              <p className="text-gray-600 mb-8">
                {edit && !isEditingDisabled
                  ? "You are able to manage the questions participants will answer for this program before the program begins"
                  : "The program has begun and you are no longer able to edit the program"}
              </p>
            </div>

            {/* Divider */}
            <div className="w-full max-w-2xl border-t-2 border-gray-200 my-8"></div>
          </div>

          {error && <PearAlert type="error" message={error} />}
          {successMessage && (
            <PearAlert type="success" message={successMessage} />
          )}

          {isEditingDisabled && (
            <div className="mb-6">
              <PearAlert
                type="warning"
                message={
                  eventStatus === "TERMINATED"
                    ? "This event has ended. You can no longer edit questions."
                    : "Pairings have been published. You can no longer edit questions."
                }
              />
            </div>
          )}

          {showAddForm && (
            <PearForm
              onSave={handleSaveQuestion}
              onDelete={undefined}
              isEditing={false}
            />
          )}

          {loading && <p className="text-center py-8">Loading questions...</p>}

          {!loading && !error && questions.length === 0 && (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-500 italic">
                No questions yet for this program.
              </p>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Existing Questions</h2>
              {questions.map((q, i) => (
                <PearForm
                  key={q.id}
                  questionId={q.id}
                  questionText={q.question}
                  questionType={
                    q.options && q.options.length > 0
                      ? "multiple_choice"
                      : "text"
                  }
                  existingOptions={q.options || []}
                  canEdit={edit && !isEditingDisabled}
                  onSave={handleSaveQuestion}
                  onDelete={handleDeleteQuestion}
                  isEditing={true}
                />
              ))}
            </div>
          )}
        </div>
        {edit && !isEditingDisabled && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button
              variant="default"
              size="lg"
              className="cursor-pointer rounded-full h-12 px-6 shadow-2xl hover:shadow-3xl hover:scale-105"
              onClick={() => setShowAddForm(!showAddForm)}
              aria-label={showAddForm ? "Cancel" : "Add a Question"}
              title={showAddForm ? "Cancel" : "Add a Question"}
            >
              {!showAddForm ? (
                <Plus className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}

              <span className="hidden sm:inline ml-2 font-semibold">
                {showAddForm ? "Cancel" : "Add a Question"}
              </span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
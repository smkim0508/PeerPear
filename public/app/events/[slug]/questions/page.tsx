"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { PearAlert } from "@/components/PearAlert";
import PearButton from "@/components/PearButton";
import PearForm from "@/components/PearForm";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

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

  useEffect(() => {
    fetchQuestions();
  }, [event_id]);

  useEffect(() => {
    fetchPermissions();
  }, [event_id]);

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
      const res = await fetch(`${apiUrl}/question_management/${event_id}`);
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
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      //Endpoint is:
      //  DELETE /delete-question/<question_id>
      const res = await fetch(
        `${apiUrl}/question_management/delete-question/${questionId}`,
        {
          method: "DELETE",
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

  if (permissionsLoading) {
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
            <h2 className="text-xl font-semibold mb-2">Event Access Error</h2>
            <p className="text-gray-600 mb-4">
              You are not able to view this Event
            </p>
            <PearButton
              text="Back to Events"
              onClick={() => router.push("/organization")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Navbar userType="organization" />
      <div className="min-h-screen bg-[#EBECE4] p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-row justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-4">Questionnaire Page</h1>
              <p className="text-gray-600 mb-8">
                {!edit || !view
                  ? "You are able to manage the questions participants will answer for this event before the event begins"
                  : "The event has begun and you are no longer able to edit the event"}
              </p>
            </div>
            {edit && (
              <div>
                <PearButton
                  text={showAddForm ? "Cancel" : "Add a Question"}
                  className=""
                  onClick={() => setShowAddForm(!showAddForm)}
                />
              </div>
            )}
          </div>

          {error && <PearAlert type="error" message={error} />}
          {successMessage && (
            <PearAlert type="success" message={successMessage} />
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
                No questions yet for this event. Add your first question above!
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
                  canEdit={edit}
                  onSave={handleSaveQuestion}
                  onDelete={handleDeleteQuestion}
                  isEditing={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

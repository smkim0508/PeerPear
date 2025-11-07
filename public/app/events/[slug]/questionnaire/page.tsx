"use client";
import Navbar from "@/components/Navbar";
import PearButton from "@/components/PearButton";
import PearQuestion from "@/components/PearQuestion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { use, useEffect, useState } from "react";
import { PearAlert } from "@/components/PearAlert";
import { useRouter } from "next/navigation";

function validateAnswers(questions: any[], answers: Record<number, string>) {
  const invalidAnswers = [];

  for (const q of questions) {
    const question_id = q.id;
    const value = answers[question_id];

    if (!value || value.trim() === "") {
      invalidAnswers.push(question_id);
      continue;
    }

    if (q.options && q.options.length > 0 && !q.options.includes(value)) {
      invalidAnswers.push(question_id);
    }
  }

  return invalidAnswers;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [alert, setAlert] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const handleAnswerChange = (questionId: number, newValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: newValue,
    }));
  };

  useEffect(() => {
    const get_questions = async () => {
      try {
        // HARDCODED FOR NOW
        const event_id = 3;
        const user_id = 2;
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

        const res = await fetch(
          `${apiUrl}/questionnaire/${event_id}/${user_id}`,
          {
            credentials: "include", // Include cookies for authentication
          }
        );

        const data = await res.json();

        if (res.ok) {
          setQuestions(data.questions);
          setAnswers(data.answers);
        } else {
          console.error("Error from server:", data.error);
          setError(data.error || "Failed to load questions");
        }
      } catch (err) {
        console.log("Error fetching events", err);
        setError("Failed to fetch questions");
      } finally {
        setLoading(false);
      }
    };

    get_questions();
  }, []);

  useEffect(() => {
    console.log("Current questions", questions);
    console.log("Current answers:", answers);
  }, [answers, questions]);

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setAlert({
        type: "error",
        message: "You must accept the terms and conditions before submitting.",
      });
      return;
    }

    const invalidAnswers = validateAnswers(questions, answers);

    if (invalidAnswers.length > 0) {
      setAlert({
        type: "error",
        message:
          "Please ensure all questions are answered correctly before submitting.",
      });
      return;
    }

    try {
      // HARDCODED FOR NOW
      const event_id = 3;
      const user_id = 2;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const responses = Object.entries(answers).map(
        ([question_id, answer]) => ({
          question_id: Number(question_id),
          answer: answer,
        })
      );

      const res = await fetch(`${apiUrl}/questionnaire/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event_id,
          user_id: user_id,
          responses: responses,
        }),
      });

      const data = await res.json();
      if (res.ok) {
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
      console.error("Submit error:", error);
      setAlert({
        type: "error",
        message: "Server error. Please try again later.",
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
      <Navbar userType="student" />
      <div className="min-h-screen bg-[#EBECE4]">
        <div className="flex flex-col items-center p-6 pt-12">
          <div className="text-center mb-8 max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Questionnaire Form
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-3">
              Help us find the perfect peer match for you by answering a few
              questions about your preferences and goals.
            </p>
            {alert && <PearAlert type={alert.type} message={alert.message} />}
          </div>
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
                    />
                  ))
                )}

                {/*
                <PearQuestion
                  value={answers[1] || ""}
                  questionId={1}
                  onChange={handleAnswerChange}
                  question="What are your learning goals for this event?"
                  number={1}
                />
                <PearQuestion
                  questionId={2}
                  value={answers[2] || ""}
                  onChange={handleAnswerChange}
                  question="What skills or experiences are you hoping to gain?"
                  number={2}
                />
                <PearQuestion
                  questionId={3}
                  value={answers[3] || ""}
                  onChange={handleAnswerChange}
                  question="How do you prefer to communicate with your peer?"
                  number={3}
                  type="radio"
                  options={[
                    "Email",
                    "Slack",
                    "In-person meetings",
                    "Video calls",
                    "Text messaging",
                  ]}
                />
                <PearQuestion
                  value={answers[4] || ""}
                  questionId={4}
                  onChange={handleAnswerChange}
                  question="What is your availability for meetings?"
                  number={4}
                  type="radio"
                  options={[
                    "Weekday mornings",
                    "Weekday afternoons",
                    "Weekday evenings",
                    "Weekends",
                    "Flexible/anytime",
                  ]}
                />
                <PearQuestion
                  questionId={5}
                  value={answers[5] || ""}
                  onChange={handleAnswerChange}
                  question="What is your experience level with the event topic?"
                  number={5}
                  type="radio"
                  options={["Beginner", "Intermediate", "Advanced", "Expert"]}
                />
                <PearQuestion
                  questionId={6}
                  value={answers[6] || ""}
                  onChange={handleAnswerChange}
                  question="How do you prefer to learn?"
                  number={6}
                  type="radio"
                  options={[
                    "Hands-on practice",
                    "Discussion and theory",
                    "Visual demonstrations",
                    "Reading materials",
                    "Mixed approach",
                  ]}
                />
                <PearQuestion
                  questionId={7}
                  value={answers[7] || ""}
                  onChange={handleAnswerChange}
                  question="What is your preferred meeting frequency?"
                  number={7}
                  type="radio"
                  options={[
                    "Daily",
                    "Every few days",
                    "Weekly",
                    "Bi-weekly",
                    "As needed",
                  ]}
                />
                <PearQuestion
                  questionId={8}
                  value={answers[8] || ""}
                  onChange={handleAnswerChange}
                  question="Is there anything else you'd like your peer to know about you?"
                  number={8}
                />
                */}
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
                      text="Submit Questionnaire"
                      className="px-8 py-3 text-lg font-semibold min-w-[200px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { PearAlert } from "@/components/PearAlert";

interface EventInfo {
  id: number;
  title: string;
  description: string;
  organization_name: string;
  image_url?: string;
  start_date?: string;
  end_date?: string;
}

export default function EventQuestionsPage() {
  //HARDCODED
  const event_id = 3;
  const router = useRouter();

  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(`${apiUrl}/event_data/${event_id}/questions`);
        const data = await res.json();

        if (res.ok) {
          setQuestions(data.questions || []);
          setEventInfo(data.event);
        } else {
          setError(data.error || "Failed to load questions.");
        }
      } catch (err) {
        setError("Server error fetching questions.");
      } finally {
        setLoading(false);
      }
    }

    if (event_id) fetchQuestions();
  }, [event_id]);

  return (
    <>
      <Navbar userType="organization" />
      <div className="min-h-screen bg-[#EBECE4] p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 ">
            {eventInfo ? `${eventInfo.title} Questions` : "Event Questions"}
          </h1>
          <p className="text-gray-600 mb-8">
            Manage the questions participants will answer for this event.
          </p>

          {loading && <p>Loading questions...</p>}
          {error && <PearAlert type="error" message={error} />}

          {!loading && !error && questions.length === 0 && (
            <p className="text-gray-500 italic">
              No questions yet for this event.
            </p>
          )}

          {!loading && !error && questions.length > 0 && (
            <ul className="space-y-4">
              {questions.map((q, i) => (
                <li
                  key={q.id}
                  className="bg-white p-4 rounded-lg shadow border border-gray-200"
                >
                  <h3 className="font-semibold">
                    {i + 1}. {q.question}
                  </h3>
                  {q.options?.length > 0 && (
                    <ul className="ml-5 mt-2 list-disc text-sm text-gray-600">
                      {q.options.map((opt: string, j: number) => (
                        <li key={j}>{opt}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

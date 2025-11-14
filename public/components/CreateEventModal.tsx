"use client";

import { useEffect, useState } from "react";
import PearButton from "./PearButton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEventModalProps) {
  const router = useRouter();

  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    endDate: "",
    imageUrl: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [dateAlert, setDateAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.endDate) {
      setShowAlert(true);

      return;
    }

    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const end = parseLocalDate(formData.endDate);

    // validate end date
    if (end <= new Date()) {
      setDateAlert(true);
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    // create the dictionary object to send over
    const newEvent = {
      title: formData.title,
      description: formData.description,
      image_url: formData.imageUrl || "",
      end_date: new Date(formData.endDate).toISOString(),
    };

    try {
      const res = await fetch(
        `${API_URL}/organization_dashboard/create-event`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEvent)
        }
      );

      if (!res.ok) {
        const errmessage = await res.text();
        throw new Error(errmessage || "Failed to create event");
      }

      setFormData({
        title: "",
        description: "",
        endDate: "",
        imageUrl: "",
      });

      const data = await res.json();
      const newEventId = data.event_id;

      setSuccessMessage("Event created successfully!");

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        router.push(`/events/${newEventId}`);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div
      className={`fixed inset-0 bg-[#0000003c] flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-6 max-w-[420px] w-full mx-4 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={"absolute top-3 right-3 "}>
          <PearButton
            text="×"
            onClick={onClose}
            className="w-8 h-8 p-0 text-lg font-bold leading-none rounded-full bg-[#D7FF9C] hover:bg-[#c7f47e] shadow-md"
          />
        </div>

        <h2 className="text-xl font-bold mb-1.5 text-[#1a1a1a] text-center">
          Create New Event
        </h2>
        {showAlert && (
          <Alert className="mt-4 mb-4 border-red-400 bg-red-50">
            <AlertTitle className="font-semibold text-red-700">
              Missing fields
            </AlertTitle>
            <AlertDescription className="text-red-600">
              Please include a title, description, and valid end date before
              submitting.
            </AlertDescription>
            <button
              className="absolute top-2 right-3 text-red-500 hover:text-red-700"
              onClick={() => setShowAlert(false)}
            >
              ×
            </button>
          </Alert>
        )}

        {dateAlert && (
          <Alert className="mt-4 mb-4 border-red-400 bg-red-50">
            <AlertTitle className="font-semibold text-red-700">
              Invalid Dates
            </AlertTitle>
            <AlertDescription className="text-red-600">
              Please make sure the end date is later than today.
            </AlertDescription>
            <button
              className="absolute top-2 right-3 text-red-500 hover:text-red-700"
              onClick={() => setDateAlert(false)}
            >
              ×
            </button>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mt-4 mb-4 border-green-400 bg-green-50">
            <AlertTitle className="font-semibold text-green-700">
              Success!
            </AlertTitle>
            <AlertDescription className="text-green-600">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert className="mt-4 mb-4 border-red-400 bg-red-50">
            <AlertTitle className="font-semibold text-red-700">
              Submission Failed
            </AlertTitle>
            <AlertDescription className="text-red-600">
              {submitError}
            </AlertDescription>
            <button
              className="absolute top-2 right-3 text-red-500 hover:text-red-700"
              onClick={() => setSubmitError(null)}
            >
              ×
            </button>
          </Alert>
        )}

        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D7FF9C]"
        />
        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          Description
        </label>
        <textarea
          placeholder="Describe your event"
          rows={3}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D7FF9C]"
        />
        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          End Date
        </label>
        <input
          value={formData.endDate}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value })
          }
          type="date"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D7FF9C]"
        />
        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          Image URL
        </label>
        <input
          value={formData.imageUrl}
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
          type="text"
          placeholder="Paste an image link (optional)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D7FF9C]"
        />

        <PearButton
          className={`w-full px-3 py-2 mt-6 ${
            submitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
          text={submitting ? "Submitting..." : "Submit Event"}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}

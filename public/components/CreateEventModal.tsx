"use client";

import { useEffect, useState } from "react";
import PearButton from "./PearButton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";


interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
}: CreateEventModalProps) {
  const router = useRouter();

  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    endDate: "",
    imageFile: null as File | null,
    checkSiblingRoles: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Reset form and errors when closing
      setFormData({
        title: "",
        description: "",
        endDate: "",
        imageFile: null,
        checkSiblingRoles: false,
      });
      setErrors({});
      setSubmitError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
      isValid = false;
    } else {
      const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const end = parseLocalDate(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Compare dates only

      if (end <= today) {
        newErrors.endDate = "End date must be in the future";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("end_date", new Date(formData.endDate).toISOString());
    form.append("check_sibling_roles", String(formData.checkSiblingRoles));

    if (formData.imageFile) {
      form.append("image", formData.imageFile);
    }

    form.append("organization_id", organizationId.toString());

    try {
      const res = await fetch(
        `${API_URL}/organization_dashboard/create-event`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        }
      );

      if (!res.ok) {
        const errmessage = await res.text();
        throw new Error(errmessage || "Failed to create program");
      }

      const data = await res.json();
      const newEventId = data.event_id;

      setSuccessMessage("Program created successfully!");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        router.push(`/events/${newEventId}`);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | File | null | boolean
  ) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-[#0000003c] flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"
        }`}
      onClick={onClose}
    >
      <div
        className={`bg-[#EBECE4] rounded-2xl border-4 border-[#8cbf70] p-6 max-w-[420px] w-full mx-4 shadow-2xl transition-all duration-300 ${isAnimating
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 translate-y-4"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={"absolute top-3 right-3 "}>
          <PearButton
            text="×"
            onClick={onClose}
            className="w-8 h-8 p-0 text-lg font-bold leading-none rounded-full bg-[#8cbf70] hover:bg-[#8cbf70] shadow-md"
          />
        </div>

        <h2 className="text-xl font-bold mb-1.5 text-[#1a1a1a] text-center">
          Create New Program
        </h2>

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
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter program title"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.title
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:ring-[#8cbf70]"
            }`}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}

        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          Description
        </label>
        <textarea
          placeholder="Describe your program"
          rows={3}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 ${errors.description
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:ring-[#8cbf70]"
            }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description}</p>
        )}

        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          End Date
        </label>
        <input
          value={formData.endDate}
          onChange={(e) => handleInputChange("endDate", e.target.value)}
          type="date"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.endDate
            ? "border-red-500 focus:ring-red-200"
            : "border-gray-300 focus:ring-[#8cbf70]"
            }`}
        />
        {errors.endDate && (
          <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
        )}

        <label className="block text-sm font-semibold text-[#1a1a1a] mt-4 mb-1">
          Optional Program Image
        </label>
        <input
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            handleInputChange("imageFile", file);
          }}
          type="file"
          accept="image/*"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8cbf70]"
        />

        <div className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 p-3">
          <input
            id="checkSiblingRoles"
            type="checkbox"
            checked={formData.checkSiblingRoles}
            onChange={(e) =>
              handleInputChange("checkSiblingRoles", e.target.checked)
            }
            className="mt-1 size-4 rounded border-gray-300"
          />
          <label htmlFor="checkSiblingRoles" className="text-sm">
            Big-Little pairing mode
            <span className="block text-xs text-gray-600">
              When enabled, participants are assigned Big/Little sibling roles.
            </span>
          </label>
        </div>

        <PearButton
          className={`w-full px-3 py-2 mt-6 ${submitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          text={submitting ? "Submitting..." : "Submit Program"}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}


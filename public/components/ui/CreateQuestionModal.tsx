import { useEffect, useState } from "react";
import PearButton from "../PearButton";
import { PearAlert } from "../PearAlert";
import { useRouter } from "next/navigation";
import PearSwitch from "../PearSwitch";

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event_id: number;
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
export default function CreateQuestionModal({
  isOpen,
  onClose,
  event_id,
  onSuccess,
}: CreateQuestionModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [questionType, setQuestionType] = useState<"Textbox" | "Radio">(
    "Textbox"
  );
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tabOptions = ["Textbox", "Radio"];

  useEffect(() => {
    if (submitError || successMessage) {
      const timer = setTimeout(() => {
        setSubmitError(null);
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitError, successMessage]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const setAnswerType = (option: string) => {
    if (option == "Textbox") {
      setOptions([]);
    } else setOptions(["", ""]);

    setQuestionType(option as "Textbox" | "Radio");
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setSubmitError("Please enter a question.");
      return;
    }

    if (questionType == "Radio") {
      const filledOptions = options.filter((opt) => opt.trim() !== "");
      if (filledOptions.length < 2) {
        setSubmitError(
          "At least two options are required for multiple choice."
        );
        return;
      }
    }

    setSubmitError(null);
    setSubmitting(true);

    const newQuestion = {
      question: question,
      options: questionType === "Radio" ? options : [],
      event_id: event_id,
    };

    try {
      const res = await fetch(
        `${API_URL}/question_management/create-question`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newQuestion),
        }
      );

      if (!res.ok) {
        const errmessage = await res.text();
        throw new Error(errmessage || "Failed to create program");
      }

      setQuestion("");
      setOptions([]);
      setQuestionType("Textbox");

      setSuccessMessage("Question successfully added");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
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
        className={`bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-6 max-w-[420px] w-full mx-4 shadow-2xl  max-h-[85vh] overflow-y-auto  transition-all duration-300 ${
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

        <h2 className="text-xl font-bold mb-7 text-[#1a1a1a] text-center">
          Create New Question
        </h2>

        <div className="flex flex-col items-center justify-center mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide text-center">
            Choose Answer Type
          </h4>
          <PearSwitch
            options={tabOptions}
            activeOption={questionType}
            onOptionChange={setAnswerType}
          />
        </div>

        <label className="block text-sm font-semibold uppercase text-gray-700 text-center text-[#1a1a1a] mt-4 mb-1">
          Question
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter question"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D7FF9C]"
        />

        {questionType === "Radio" && (
          <div className="space-y-2 mt-3 ">
            <label className="block text-sm font-semibold uppercase text-gray-700 text-center text-[#1a1a1a] mt-4 mb-1">
              Options
            </label>

            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  value={option}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((opt, i) => (i === index ? e.target.value : opt))
                    )
                  }
                  placeholder={`Option ${index + 1}`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D7FF9C]"
                />
                {options.length > 2 && (
                  <button
                    onClick={() =>
                      setOptions((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <PearButton
              text="+ Add Option"
              className="w-fit mt-3 px-4 py-2 text-sm font-medium bg-transparent border border-[#D7FF9C] text-gray-700 hover:bg-[#D7FF9C] transition"
              onClick={() => setOptions([...options, ""])}
            />
          </div>
        )}

        {submitError && (
          <div className="mt-4 mb-2">
            <PearAlert type="error" message={submitError} />
          </div>
        )}

        {successMessage && (
          <div className="mt-4 mb-2">
            <PearAlert type="success" message={successMessage} />
          </div>
        )}
        <PearButton
          className={`w-full px-3 py-2 mt-6 ${
            submitting ? "opacity-70 cursor-not-allowed" : ""
          }`}
          text={submitting ? "Submitting..." : "Submit Question"}
          onClick={!submitting ? handleSubmit : undefined}
        />
      </div>
    </div>
  );
}

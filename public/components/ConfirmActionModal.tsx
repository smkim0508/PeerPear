"use client";

import { useEffect, useState } from "react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  confirmText?: string; // default: "Yes"
  cancelText?: string; // default: "No"
  onConfirm: () => Promise<void> | void; // parent-provided callback
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  message,
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
}: ConfirmActionModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      document.body.style.overflow = "auto";
      setIsAnimating(false);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-[#0000003c] flex items-center justify-center text-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[#EBECE4] rounded-2xl border-4 border-[#D7FF9C] p-6 max-w-sm w-full mx-4 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">{message}</h2>

        <div className="flex justify-center gap-10 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition"
          >
            {cancelText}
          </button>

          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-400 transition"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

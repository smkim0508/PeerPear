"use client";

import { useEffect, useState } from "react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  checkbox?: string;
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  message,
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
  checkbox,
}: ConfirmActionModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      document.body.style.overflow = "auto";
      setIsAnimating(false);
      setIsChecked(false); // reset state when closed
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
        className={`bg-[#EBECE4] rounded-2xl border-4 border-primary p-6 max-w-sm w-full mx-4 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">{message}</h2>

        {/* Acknowledgement checkbox */}
        {checkbox && (
          <div className="flex items-center justify-start gap-3 mt-4">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="h-5 w-5"
            />
            <label className="text-left text-sm text-gray-700">
              {checkbox}
            </label>
          </div>
        )}

        <div className="flex justify-center gap-10 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition"
          >
            {cancelText}
          </button>

          <button disabled = {false}
            onClick={async () => {
              if (checkbox && !isChecked) return;
              await onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md text-white transition bg-primary hover:bg-primary/90 cursor-pointer`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

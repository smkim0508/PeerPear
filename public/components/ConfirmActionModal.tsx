"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  checkbox?: string;
  variant?: "warning" | "success" | "danger";
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  message,
  confirmText = "Yes",
  cancelText = "No",
  onConfirm,
  checkbox,
  variant = "warning",
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
      setIsChecked(false);
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      icon: <AlertCircle className="w-12 h-12 text-amber-500" />,
      iconBg: "bg-amber-100",
      border: "border-amber-300",
    },
    success: {
      icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
      iconBg: "bg-green-100",
      border: "border-green-300",
    },
    danger: {
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      iconBg: "bg-red-100",
      border: "border-red-300",
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transition-all duration-300 ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`${currentVariant.iconBg} rounded-full p-4 mb-4`}>
            {currentVariant.icon}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Are you sure?
          </h2>
          
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            {message}
          </p>
        </div>

        {checkbox && (
          <div className={`flex items-start gap-3 p-4 rounded-lg border-2 ${currentVariant.border} bg-gray-50 mb-6`}>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="h-5 w-5 mt-0.5 cursor-pointer accent-primary flex-shrink-0"
              id="confirmation-checkbox"
            />
            <label 
              htmlFor="confirmation-checkbox"
              className="text-left text-sm text-gray-700 leading-relaxed cursor-pointer"
            >
              {checkbox}
            </label>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            {cancelText}
          </button>

          <button
            disabled={checkbox ? !isChecked : false}
            onClick={async () => {
              if (checkbox && !isChecked) return;
              await onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3 rounded-lg text-white font-semibold transition-all ${
              checkbox && !isChecked
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 cursor-pointer"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
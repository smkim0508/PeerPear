import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PearQuestionProps {
  questionId: number;
  question: string;
  number: number;
  maxLength?: number;
  type?: "textarea" | "radio";
  options?: string[];

  value: string;
  onChange: (questionId: number, newValue: string) => void;
}

export default function PearQuestion({
  questionId,
  question,
  number,
  maxLength = 120,
  type = "textarea",
  options = [],
  value,
  onChange,
  disabled = false,
}: PearQuestionProps & { disabled?: boolean }) {
  const charactersLeft = maxLength - value.length;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-100 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-lg">{number}</span>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold text-gray-900 leading-relaxed">
              {question}
            </p>
          </div>
        </div>
      </div>

      {type === "textarea" ? (
        <div className="ml-14">
          <InputGroup>
            <InputGroupTextarea
              placeholder="Share your thoughts here."
              value={value}
              onChange={(e) => onChange(questionId, e.target.value)}
              maxLength={maxLength}
              disabled={disabled}
              className="min-h-[120px] text-base resize-none"
            />
            <InputGroupAddon align="block-end">
              <InputGroupText
                className={`text-xs font-medium transition-colors ${
                  charactersLeft < 20
                    ? "text-red-500"
                    : charactersLeft < 40
                    ? "text-amber-500"
                    : "text-gray-500"
                }`}
              >
                {charactersLeft} characters remaining
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      ) : (
        <div className="ml-14">
          <RadioGroup
            value={value}
            onValueChange={(val) => onChange(questionId, val)}
            className="gap-3"
            disabled={disabled}
          >
            {options.map((option, index) => (
              <label
                key={index}
                htmlFor={`${questionId}-${index}`}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                } ${
                  value === option
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <RadioGroupItem
                  value={option}
                  id={`${questionId}-${index}`}
                  disabled={disabled}
                  className="flex-shrink-0"
                />
                <span
                  className={`text-base font-medium flex-1 ${
                    value === option ? "text-primary" : "text-gray-700"
                  }`}
                >
                  {option}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}

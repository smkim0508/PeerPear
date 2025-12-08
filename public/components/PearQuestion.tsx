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
    <div className="flex flex-col rounded-lg gap-y-4">
      <p className="text-md font-bold">
        {number}. {question}
      </p>

      {type === "textarea" ? (
        <InputGroup>
          <InputGroupTextarea
            placeholder="Enter your message"
            value={value}
            onChange={(e) => onChange(questionId, e.target.value)}
            maxLength={maxLength}
            disabled={disabled}
          />
          <InputGroupAddon align="block-end">
            <InputGroupText
              className={`text-xs ${charactersLeft < 20 ? "text-red-500" : "text-muted-foreground"
                }`}
            >
              {charactersLeft} characters left
            </InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <RadioGroup
          value={value}
          onValueChange={(val) => onChange(questionId, val)}
          className="gap-3"
          disabled={disabled}
        >
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <RadioGroupItem value={option} id={`${number}-${index}`} disabled={disabled} />
              <Label
                htmlFor={`${number}-${index}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}

import { InputGroup, InputGroupAddon, InputGroupTextarea, InputGroupText } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PearQuestionProps {
    question: string;
    number: number;
    maxLength?: number;
    type?: "textarea" | "radio";
    options?: string[];
}

export default function PearQuestion({
    question,
    number,
    maxLength = 120,
    type = "textarea",
    options = []
}: PearQuestionProps) {
    const [inputValue, setInputValue] = useState("");
    const [selectedValue, setSelectedValue] = useState("");
    const charactersLeft = maxLength - inputValue.length;

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= maxLength) {
            setInputValue(value);
        }
    };

    const handleRadioChange = (value: string) => {
        setSelectedValue(value);
    };

    return (
        <div className="flex flex-col rounded-lg gap-y-4">
            <p className="text-md font-bold">{number}. {question}</p>

            {type === "textarea" ? (
                <InputGroup>
                    <InputGroupTextarea
                        placeholder="Enter your message"
                        value={inputValue}
                        onChange={handleInputChange}
                        maxLength={maxLength}
                    />
                    <InputGroupAddon align="block-end">
                        <InputGroupText className={`text-xs ${charactersLeft < 20 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {charactersLeft} characters left
                        </InputGroupText>
                    </InputGroupAddon>
                </InputGroup>
            ) : (
                <RadioGroup value={selectedValue} onValueChange={handleRadioChange} className="gap-3">
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${number}-${index}`} />
                            <Label htmlFor={`${number}-${index}`} className="text-sm font-normal cursor-pointer">
                                {option}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            )}
        </div>
    )
}
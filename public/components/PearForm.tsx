'use client';

import { useState } from "react";
import { Trash2, Edit2, Plus, X } from "lucide-react";
import PearButton from "./PearButton";

interface PearFormProps {
    questionId?: number;
    questionText?: string;
    questionType?: "text" | "multiple_choice";
    existingOptions?: string[];
    onSave: (data: {
        id?: number;
        question: string;
        type: "text" | "multiple_choice";
        options?: string[];
    }) => void;
    onDelete?: (id: number) => void;
    isEditing?: boolean;
}

export default function PearForm({
    questionId,
    questionText = "",
    questionType = "text",
    existingOptions = [],
    onSave,
    onDelete,
    isEditing = false,
}: PearFormProps) {
    const [question, setQuestion] = useState(questionText);
    const [type, setType] = useState<"text" | "multiple_choice">(questionType);
    const [options, setOptions] = useState<string[]>(
        existingOptions.length > 0 ? existingOptions : [""]
    );
    const [showForm, setShowForm] = useState(!isEditing);

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 1) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleTypeChange = (newType: "text" | "multiple_choice") => {
        setType(newType);
        if (newType === "text") {
            setOptions([]);
        } else if (options.length === 0) {
            setOptions([""]);
        }
    };

    const handleSave = () => {
        if (!question.trim()) {
            alert("Please enter a question");
            return;
        }

        if (type === "multiple_choice") {
            const validOptions = options.filter((opt) => opt.trim() !== "");
            if (validOptions.length < 2) {
                alert("Please provide at least 2 options for multiple choice");
                return;
            }
            onSave({
                id: questionId,
                question,
                type,
                options: validOptions,
            });
        } else {
            onSave({
                id: questionId,
                question,
                type,
            });
        }

        // Reset form if not editing
        if (!isEditing) {
            setQuestion("");
            setType("text");
            setOptions([""]);
        }
        setShowForm(false);
    };

    const handleCancel = () => {
        if (isEditing) {
            setQuestion(questionText);
            setType(questionType);
            setOptions(existingOptions.length > 0 ? existingOptions : [""]);
        }
        setShowForm(false);
    };

    if (!showForm && isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{questionText}</h3>
                        <p className="text-sm text-gray-500 mb-2">
                            Type: {questionType === "text" ? "Text Input" : "Multiple Choice"}
                        </p>
                        {questionType === "multiple_choice" && existingOptions.length > 0 && (
                            <ul className="ml-5 mt-2 list-disc text-sm text-gray-600">
                                {existingOptions.map((opt, i) => (
                                    <li key={i}>{opt}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowForm(true)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit question"
                        >
                            <Edit2 size={18} />
                        </button>
                        {onDelete && questionId && (
                            <button
                                onClick={() => onDelete(questionId)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete question"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-4">
            <h3 className="font-semibold text-lg mb-4">
                {isEditing ? "Edit Question" : "Add New Question"}
            </h3>

            {/* Question Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                </label>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green focus:border-transparent"
                />
            </div>

            {/* Question Type Selector */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                </label>
                <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="questionType"
                            value="text"
                            checked={type === "text"}
                            onChange={() => handleTypeChange("text")}
                            className="mr-2 cursor-pointer"
                        />
                        <span className="text-sm">Text Input</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="questionType"
                            value="multiple_choice"
                            checked={type === "multiple_choice"}
                            onChange={() => handleTypeChange("multiple_choice")}
                            className="mr-2 cursor-pointer"
                        />
                        <span className="text-sm">Multiple Choice</span>
                    </label>
                </div>
            </div>

            {/* Multiple Choice Options */}
            {type === "multiple_choice" && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                    </label>
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green focus:border-transparent"
                                />
                                {options.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveOption(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove option"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleAddOption}
                        className="mt-2 flex items-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium"
                    >
                        <Plus size={16} />
                        Add Option
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <PearButton text="Save Question" onClick={handleSave} />
            </div>
        </div>
    );
}
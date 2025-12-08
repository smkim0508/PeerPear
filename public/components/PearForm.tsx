'use client';

import { useState, useEffect } from "react";
import { Trash2, Edit2, Plus, X, FileQuestion } from "lucide-react";
import PearButton from "./PearButton";

interface PearFormProps {
    questionId?: number;
    questionText?: string;
    questionType?: "text" | "multiple_choice";
    existingOptions?: string[];
    canEdit?: boolean
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
    canEdit,
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
    const [errors, setErrors] = useState({
        question: "",
        options: "",
    });

    useEffect(() => {
        if (errors.question || errors.options) {
            const timer = setTimeout(() => {
                setErrors({ question: "", options: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    const validate = () => {
        let newErrors = { question: "", options: "" };
        let valid = true;

        if (!question.trim()) {
            newErrors.question = "Please enter a valid question";
            valid = false;
        }

        if (type === "multiple_choice") {
            const validOptions = options.filter((o) => o.trim() !== "");

            if (validOptions.length < 2) {
                newErrors.options = "Please provide at least 2 options for multiple choice";
                valid = false;
            }

            const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
        if (uniqueOptions.size !== validOptions.length) {
            newErrors.options = "Duplicate options are not allowed. Please ensure all options are unique.";
            valid = false;
        }
        }

        setErrors(newErrors);
        return valid;
    };

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
        if (!validate()) return;

        const validOptions =
            type === "multiple_choice"
                ? options.filter((opt) => opt.trim() !== "")
                : [];

        onSave({
            id: questionId,
            question,
            type,
            options: validOptions,
        });

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
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 mb-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="mt-1 flex-shrink-0">
                                <FileQuestion className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg text-gray-900 leading-snug break-words">
                                    {questionText}
                                </h3>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                questionType === "text" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-purple-100 text-purple-800"
                            }`}>
                                {questionType === "text" ? "Text Input" : "Multiple Choice"}
                            </span>
                        </div>
                        
                        {questionType === "multiple_choice" && existingOptions.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Answer Options
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {existingOptions.map((opt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-800 shadow-sm hover:border-primary transition-colors"
                                        >
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <span className="break-words">{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {canEdit && (
                        <div className="flex gap-2 flex-shrink-0">
                            <button
                                onClick={() => setShowForm(true)}
                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-105 active:scale-95"
                                title="Edit question"
                            >
                                <Edit2 size={18} />
                            </button>
                            {onDelete && questionId && (
                                <button
                                    onClick={() => onDelete(questionId)}
                                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-105 active:scale-95"
                                    title="Delete question"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <FileQuestion className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">
                    {isEditing ? "Edit Question" : "Add New Question"}
                </h3>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Text
                </label>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here..."
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20
                        ${errors.question ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-primary"}
                    `}
                />
                {errors.question && (
                    <p className="text-red-500 text-sm mt-2">
                        {errors.question}
                    </p>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Question Type
                </label>
                <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        type === "text" 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-gray-300 hover:border-gray-400"
                    }`}>
                        <input
                            type="radio"
                            name="questionType"
                            value="text"
                            checked={type === "text"}
                            onChange={() => handleTypeChange("text")}
                            className="cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium">Text Input</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        type === "multiple_choice" 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "border-gray-300 hover:border-gray-400"
                    }`}>
                        <input
                            type="radio"
                            name="questionType"
                            value="multiple_choice"
                            checked={type === "multiple_choice"}
                            onChange={() => handleTypeChange("multiple_choice")}
                            className="cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium">Multiple Choice</span>
                    </label>
                </div>
            </div>

            {type === "multiple_choice" && (
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Answer Options
                    </label>
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    className={`flex-1 px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                        errors.options ? "border-red-500" : "border-gray-300 focus:border-primary"
                                    }`}
                                />
                                {options.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveOption(index)}
                                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-105 active:scale-95"
                                        title="Remove option"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {errors.options && (
                        <p className="text-red-500 text-sm mt-2">
                            {errors.options}
                        </p>
                    )}

                    <button
                        onClick={handleAddOption}
                        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        Add Another Option
                    </button>
                </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                
                <PearButton text="Save Question" onClick={handleSave} />
            </div>
        </div>
    );
}
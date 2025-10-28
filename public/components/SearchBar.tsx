"use client";

import { useState } from "react";

export default function SearchBar() {
  const [activeTab, setActiveTab] = useState<"event" | "organization">("event");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full px-4">
      <div className="w-full max-w-full mx-auto">
        <div className="flex items-center gap-4 w-full">
          {/* Search input (left, fills remaining space) */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder={`Search ${
                  activeTab === "event" ? "events" : "organizations"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#CCCEC1] bg-white focus:border-[#D7FF9C] focus:outline-none transition-colors duration-200"
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filter buttons (right, fixed width) */}
          <div className="inline-flex bg-[#CCCEC1] rounded-xl p-1.5 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("event")}
              aria-pressed={activeTab === "event"}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === "event"
                  ? "bg-[#D7FF9C] text-[#1a1a1a] shadow-md scale-105"
                  : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
              }`}
            >
              Events
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("organization")}
              aria-pressed={activeTab === "organization"}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === "organization"
                  ? "bg-[#D7FF9C] text-[#1a1a1a] shadow-md scale-105"
                  : "bg-transparent text-[#1a1a1a] hover:bg-[#b8baa8]"
              }`}
            >
              Organizations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

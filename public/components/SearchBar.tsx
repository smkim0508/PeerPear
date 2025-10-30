"use client";

import { useState } from "react";
import PearSwitch from "./PearSwitch";

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
                placeholder={`Search ${activeTab === "event" ? "events" : "organizations"
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

          <PearSwitch
            option1="event"
            option2="organization"
            activeOption={activeTab}
            onOptionChange={(option) => setActiveTab(option as "event" | "organization")}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import PearSwitch from "./PearSwitch";

type SearchBarProps = {
  activeTab: "program" | "organization";
  setActiveTab: (tab: "program" | "organization") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export default function SearchBar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}: SearchBarProps) {
  return (
    <div className="w-full px-4">
      <div className="w-full max-w-full mx-auto">
        <div className="flex w-full items-center justify-between gap-3 sm:gap-4">
          {/* Search input (left, fills remaining space) */}
          <div className="flex-1 min-w-0">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                placeholder={`Search by ${activeTab === "program" ? "program" : "organization"
                  }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border bg-input text-foreground shadow-xs focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:outline-none transition-colors duration-200"
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
          <PearSwitch
            options={["program", "organization"]}
            activeOption={activeTab}
            onOptionChange={(option) =>
              setActiveTab(option as "program" | "organization")
            }
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}

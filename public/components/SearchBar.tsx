"use client";

import PearSwitch from "./PearSwitch";

type SearchBarProps = {
  activeTab: "event" | "organization";   // ← restored
  setActiveTab: (tab: "event" | "organization") => void;  // ← restored
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
        <div className="flex items-center gap-4 w-full">

          {/* Search input */}
          <div className="flex-1 min-w-56">
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
          </div>

          {/* Event/Organization switch (restored) */}
          <PearSwitch
            options={["event", "organization"]}
            activeOption={activeTab}
            onOptionChange={(option) =>
              setActiveTab(option as "event" | "organization")
            }
            className="shrink-0 mt-4"
          />
        </div>
      </div>
    </div>
  );
}

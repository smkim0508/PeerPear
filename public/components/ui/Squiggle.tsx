import React from "react";

interface SquiggleProps {
  width?: number;
  className?: string;
}

export function Squiggle({ width = 140, className = "" }: SquiggleProps) {
  return (
    <svg
      width={width}
      height="14"
      viewBox="0 0 140 14"
      preserveAspectRatio="none"
      className={`block absolute ${className}`}
    >
      <path
        d="M0 7 Q10 2, 20 7 T40 7 T60 7 T80 7 T100 7 T120 7 T140 7"
        stroke="#D7FF9C"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

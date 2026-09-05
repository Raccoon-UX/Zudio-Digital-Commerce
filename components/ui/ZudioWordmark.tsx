"use client";

import React from "react";

interface ZudioWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
}

const sizeClasses = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-12 w-auto",
  xl: "h-14 sm:h-16 md:h-20 w-auto",
};

export const ZudioWordmark: React.FC<ZudioWordmarkProps> = ({
  className = "",
  size = "xl",
  variant = "dark",
}) => {
  const color = variant === "dark" ? "#0a0a0a" : "#ffffff";

  return (
    <svg
      viewBox="0 0 260 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} ${className} select-none`}
      aria-label="Zudio"
    >
      {/* Letter 'z' */}
      <path
        d="M 6 18 H 46 L 6 52 H 46"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Letter 'u' */}
      <path
        d="M 64 18 V 38 C 64 48 70 52 80 52 C 90 52 96 48 96 38 V 18"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Letter 'd' */}
      <path
        d="M 144 6 V 52 M 144 42 C 144 49 138 52 128 52 C 118 52 112 45 112 35 C 112 25 118 18 128 18 C 138 18 144 22 144 28"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Letter 'i' */}
      <circle cx="164" cy="9" r="4.5" fill={color} />
      <path
        d="M 164 19 V 52"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Letter 'o' */}
      <path
        d="M 204 18 H 218 C 232 18 240 25 240 35 C 240 45 232 52 218 52 H 204 C 190 52 182 45 182 35 C 182 25 190 18 204 18 Z"
        stroke={color}
        strokeWidth="9"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ZudioWordmark;

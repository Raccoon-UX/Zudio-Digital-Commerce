"use client";

import React from "react";
import Image from "next/image";

interface ZoaWordmarkProps {
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

export const ZoaWordmark: React.FC<ZoaWordmarkProps> = ({
  className = "",
  size = "xl",
  variant = "dark",
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <Image
        src="/ZoaLogo.png"
        alt="ZOA"
        width={200}
        height={100}
        priority
        className={`object-contain ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
};

export default ZoaWordmark;

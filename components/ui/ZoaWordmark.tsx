"use client";

import React from "react";
import Image from "next/image";

interface ZoaWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light";
}

const sizeClasses = {
  sm: "h-8 w-auto",
  md: "h-12 w-auto",
  lg: "h-16 w-auto",
  xl: "h-20 sm:h-24 md:h-28 lg:h-32 w-auto",
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
        width={360}
        height={180}
        priority
        className={`w-full h-full object-contain ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
};

export default ZoaWordmark;

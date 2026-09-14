"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ZoaLogoProps {
  className?: string;
  variant?: "dark" | "light";
}

export const ZoaLogo: React.FC<ZoaLogoProps> = ({ className = "", variant = "dark" }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        className={`font-black tracking-[0.24em] text-lg uppercase select-none ${
          variant === "dark" ? "text-black" : "text-white"
        } ${className}`}
      >
        ZOA
      </span>
    );
  }

  return (
    <Image
      src="/ZoaLogo.png"
      alt="ZOA"
      width={160}
      height={80}
      priority
      className={`object-contain object-left ${
        variant === "light" ? "brightness-0 invert" : ""
      } ${className}`}
      onError={() => setHasError(true)}
    />
  );
};

export default ZoaLogo;

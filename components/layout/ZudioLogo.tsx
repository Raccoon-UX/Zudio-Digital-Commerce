"use client";

import React, { useState } from "react";

interface ZudioLogoProps {
  className?: string;
  variant?: "dark" | "light"; // dark = black logo for light navbar; light = white logo for dark footer
}

const ZUDIO_WORDMARK =
  "https://cdn.brandfetch.io/idbOaCAw5z/w/222/h/44/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1781708290103";

export const ZudioLogo: React.FC<ZudioLogoProps> = ({ className = "", variant = "dark" }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <span
        className={`font-black tracking-[0.24em] text-lg uppercase select-none ${
          variant === "dark" ? "text-black" : "text-white"
        } ${className}`}
      >
        ZUDIO
      </span>
    );
  }

  return (
    <img
      src={ZUDIO_WORDMARK}
      alt="Zudio"
      className={`object-contain object-left ${
        variant === "dark" ? "brightness-0" : "brightness-100"
      } ${className}`}
      width={111}
      height={22}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

export default ZudioLogo;

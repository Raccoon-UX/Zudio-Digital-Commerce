import React from "react";

interface ZudioLogoProps {
  className?: string;
}

/**
 * Compact Zudio wordmark used throughout the concept prototype.
 * Kept as inline SVG so it renders crisply without a third-party asset dependency.
 */
export const ZudioLogo: React.FC<ZudioLogoProps> = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 300 82"
      role="img"
      aria-label="Zudio"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Zudio</title>
      <text
        x="3"
        y="65"
        fill="currentColor"
        fontFamily="Arial Rounded MT Bold, Trebuchet MS, Arial, sans-serif"
        fontSize="70"
        fontWeight="800"
        letterSpacing="-5"
      >
        zudio
      </text>
    </svg>
  );
};

export default ZudioLogo;

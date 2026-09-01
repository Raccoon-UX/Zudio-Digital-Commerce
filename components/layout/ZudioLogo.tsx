import React from "react";

interface ZudioLogoProps {
  className?: string;
}

const ZUDIO_WORDMARK = "https://cdn.brandfetch.io/idbOaCAw5z/w/222/h/44/theme/light/logo.png?c=1bxid64Mup7aczewSAYMX&t=1781708290103";

export const ZudioLogo: React.FC<ZudioLogoProps> = ({ className = "" }) => {
  return (
    <img
      src={ZUDIO_WORDMARK}
      alt="Zudio"
      className={`object-contain object-left ${className}`}
      width={111}
      height={22}
      referrerPolicy="no-referrer"
    />
  );
};

export default ZudioLogo;

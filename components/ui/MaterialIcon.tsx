import React from "react";
import { cn } from "@/lib/utils";

export type MaterialIconSize = "xs" | "sm" | "md" | "lg" | "xl" | number;

export interface MaterialIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  filled?: boolean;
  size?: MaterialIconSize;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  className?: string;
  style?: React.CSSProperties;
}

const sizeMap: Record<string, string> = {
  xs: "16px",
  sm: "18px",
  md: "20px",
  lg: "24px",
  xl: "32px",
};

export const MaterialIcon = React.forwardRef<HTMLSpanElement, MaterialIconProps>(
  (
    {
      name,
      filled = false,
      size = "md",
      weight = 400,
      grade = 0,
      opticalSize = 24,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-hidden": ariaHidden,
      ...props
    },
    ref
  ) => {
    const computedFontSize =
      typeof size === "number" ? `${size}px` : sizeMap[size] || sizeMap.md;

    const customVariationSettings = `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`;

    const isAriaHidden = ariaHidden !== undefined ? ariaHidden : !ariaLabel;

    return (
      <span
        ref={ref}
        className={cn(
          "material-symbols-outlined select-none inline-flex items-center justify-center shrink-0 leading-none",
          filled && "filled",
          className
        )}
        style={{
          fontSize: computedFontSize,
          width: computedFontSize,
          height: computedFontSize,
          fontVariationSettings: customVariationSettings,
          ...style,
        }}
        aria-hidden={isAriaHidden}
        aria-label={ariaLabel}
        {...props}
      >
        {name}
      </span>
    );
  }
);

MaterialIcon.displayName = "MaterialIcon";
export default MaterialIcon;

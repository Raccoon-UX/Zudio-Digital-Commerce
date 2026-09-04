import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-wider uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-stitch-primary text-white hover:bg-neutral-800 active:bg-black shadow-sm",
      secondary:
        "border border-stitch-primary bg-transparent text-stitch-primary hover:bg-stitch-muted active:bg-stitch-container",
      accent:
        "bg-stitch-accent text-white hover:bg-[#004b4c] active:bg-[#003c3d] shadow-sm",
      outline:
        "border border-stitch-border bg-white text-stitch-primary hover:border-stitch-primary hover:bg-stitch-muted active:bg-stitch-container",
      ghost:
        "bg-transparent text-neutral-700 hover:bg-stitch-muted hover:text-stitch-primary",
      danger:
        "bg-stitch-error text-white hover:bg-rose-700 active:bg-rose-800",
      link:
        "text-stitch-primary underline-offset-4 hover:underline p-0 h-auto font-normal normal-case",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs rounded",
      md: "h-12 px-6 text-xs tracking-wider rounded", // ~48px height per Stitch spec
      lg: "h-13 px-8 text-sm tracking-wider rounded",
      icon: "h-11 w-11 p-0 rounded",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;

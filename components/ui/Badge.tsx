import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "secondary" | "outline" | "success" | "warning" | "danger";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  className,
  children,
  ...props
}) => {
  const variantStyles: Record<string, string> = {
    default: "bg-stitch-primary text-white",
    accent: "bg-stitch-accent text-white",
    secondary: "bg-stitch-containerLow text-stitch-primary border border-stitch-border",
    outline: "border border-stitch-primary text-stitch-primary bg-transparent",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-rose-50 text-stitch-error border border-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-sm select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}) => {
  const getBadgeColor = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "danger":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  return (
    <div className="bg-white border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          {title}
        </span>
        <div className={`p-2 border ${getBadgeColor()}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black font-mono">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-neutral-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard;

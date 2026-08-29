import React from "react";
import { LucideIcon, Search } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No products found",
  description = "Try adjusting your search criteria, clearing filters, or browsing other categories.",
  icon: Icon = Search,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-neutral-50 border border-neutral-200">
      <div className="p-4 bg-white border border-neutral-200 rounded-full mb-4 text-neutral-400">
        <Icon className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold uppercase tracking-wide text-neutral-900 mb-1">
        {title}
      </h3>
      <p className="text-xs text-neutral-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

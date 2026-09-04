import React from "react";
import Button from "./Button";
import { MaterialIcon } from "./MaterialIcon";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: any;
  iconName?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No products found",
  description = "Try adjusting your search criteria, clearing filters, or browsing other categories.",
  icon: Icon,
  iconName,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-neutral-50 border border-neutral-200">
      <div className="p-4 bg-white border border-neutral-200 mb-4 text-neutral-400 inline-flex items-center justify-center">
        {iconName ? (
          <MaterialIcon name={iconName} size={32} className="text-neutral-500" />
        ) : Icon ? (
          <Icon className="h-8 w-8 stroke-[1.5]" />
        ) : (
          <MaterialIcon name="search" size={32} className="text-neutral-500" />
        )}
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

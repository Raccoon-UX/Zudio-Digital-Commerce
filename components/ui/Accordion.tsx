"use client";

import React, { createContext, useContext, useState, useId } from "react";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "./MaterialIcon";

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  type: AccordionType;
  openValues: string[];
  toggleItem: (value: string) => void;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be rendered within an <Accordion /> parent");
  }
  return context;
}

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  type = "single",
  collapsible = true,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}) => {
  const getInitialValues = (): string[] => {
    const val = value !== undefined ? value : defaultValue;
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  const [internalOpenValues, setInternalOpenValues] = useState<string[]>(getInitialValues);

  const openValues = value !== undefined ? (Array.isArray(value) ? value : [value]) : internalOpenValues;

  const toggleItem = (itemValue: string) => {
    let nextValues: string[];

    if (type === "single") {
      if (openValues.includes(itemValue)) {
        nextValues = collapsible ? [] : openValues;
      } else {
        nextValues = [itemValue];
      }
    } else {
      if (openValues.includes(itemValue)) {
        nextValues = openValues.filter((v) => v !== itemValue);
      } else {
        nextValues = [...openValues, itemValue];
      }
    }

    if (value === undefined) {
      setInternalOpenValues(nextValues);
    }

    if (onValueChange) {
      onValueChange(type === "single" ? (nextValues[0] || "") : nextValues);
    }
  };

  return (
    <AccordionContext.Provider value={{ type, openValues, toggleItem, collapsible }}>
      <div className={cn("divide-y divide-neutral-200 border-y border-neutral-200", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionItem components must be rendered within an <AccordionItem />");
  }
  return context;
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, disabled = false, className, children, ...props }, ref) => {
    const { openValues } = useAccordion();
    const generatedId = useId();
    const triggerId = `accordion-trigger-${generatedId}`;
    const contentId = `accordion-content-${generatedId}`;
    const isOpen = openValues.includes(value);

    return (
      <AccordionItemContext.Provider value={{ value, isOpen, triggerId, contentId }}>
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          className={cn("group transition-colors", disabled && "opacity-50 pointer-events-none", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, icon, ...props }, ref) => {
    const { toggleItem } = useAccordion();
    const { value, isOpen, triggerId, contentId } = useAccordionItem();

    return (
      <h3 className="flex font-sans">
        <button
          ref={ref}
          id={triggerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => toggleItem(value)}
          className={cn(
            "flex flex-1 items-center justify-between py-4 text-xs font-bold uppercase tracking-wider text-black transition-all hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black",
            className
          )}
          {...props}
        >
          <span>{children}</span>
          {icon || (
            <MaterialIcon
              name="expand_more"
              size="sm"
              className={cn(
                "text-neutral-500 transition-transform duration-200 ease-out",
                isOpen && "rotate-180 text-black"
              )}
            />
          )}
        </button>
      </h3>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, triggerId, contentId } = useAccordionItem();

    return (
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
          <div className="pb-4 pt-1 text-xs text-neutral-600 leading-relaxed font-sans">{children}</div>
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

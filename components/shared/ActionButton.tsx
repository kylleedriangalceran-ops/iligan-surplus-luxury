"use client";

import React from "react";
import { cn } from "@/lib/utils";

type ActionButtonVariant = "solid" | "outline" | "warning";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: ActionButtonVariant;
}

const variantStyles: Record<ActionButtonVariant, string> = {
  solid:
    "border-[#1C1C1E] bg-[#1C1C1E] text-[#FAF9F6] hover:bg-[#1C1C1E]/90 hover:text-[#FAF9F6]",
  outline:
    "border-[#1C1C1E]/20 bg-white text-[#1C1C1E] hover:border-[#1C1C1E]/45 hover:bg-[#1C1C1E]/[0.02]",
  warning:
    "border-amber-600/30 bg-amber-50 text-amber-700 hover:border-amber-600/55 hover:bg-amber-50",
};

export function ActionButton({
  icon,
  variant = "outline",
  className,
  children,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 md:min-h-12 min-w-0 md:min-w-[170px] items-center justify-center gap-2 md:gap-2.5 rounded-[10px] border px-3 md:px-6 py-2.5 md:py-3 text-[10px] md:text-xs font-semibold uppercase tracking-[0.14em] md:tracking-[0.18em] whitespace-nowrap transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="leading-none">{children}</span>
    </button>
  );
}

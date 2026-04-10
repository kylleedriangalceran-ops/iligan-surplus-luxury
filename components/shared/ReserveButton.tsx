"use client";

import React, { useTransition } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import { cn } from "@/lib/utils";

interface ReserveButtonProps {
  action: (formData: FormData) => void;
  disabled: boolean;
  fullWidth?: boolean;
}

export function ReserveButton({ action, disabled, fullWidth = false }: ReserveButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (formData: FormData) => {
    if (disabled) return;
    toast("Reserving item...", "pending");

    startTransition(async () => {
      try {
        await action(formData);
        toast("Item reserved! Check your reservations for the pickup code.", "success");
      } catch {
        toast("Failed to reserve. Item may be out of stock.", "error");
      }
    });
  };

  return (
    <form action={handleSubmit} className={cn(fullWidth && "w-full")}>
      <button
        type="submit"
        disabled={disabled || isPending}
        className={cn(
          "text-xs font-medium uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth
            ? "w-full py-4 px-6 tracking-[0.25em] bg-[#1C1C1E] text-[#FAF9F6] hover:bg-[#1C1C1E]/90"
            : "py-2 px-0 tracking-widest text-[#1C1C1E] border-b border-transparent group-hover:border-[#1C1C1E]"
        )}
      >
        {isPending ? "Reserving..." : disabled ? "Out of Stock" : fullWidth ? "Reserve Now" : "Reserve"}
      </button>
    </form>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useClock } from "@/hooks/useClock";

export function RealtimeClock({ className }: { className?: string }) {
  const time = useClock();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Format e.g., APRIL 08, 2026 | 14:32:01
  const dateStr = time
    .toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();

  const timeStr = time.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  if (!mounted) {
    return (
      <div className={cn("inline-flex items-center gap-2 visibility-hidden opacity-0", className)}>
        <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">
          LOADING FORMATTED DATE
        </span>
        <span className="text-[#1C1C1E]/40 text-xs">&middot;</span>
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#1C1C1E] font-semibold bg-[#1C1C1E]/5 px-2 py-0.5 border border-[#1C1C1E]/10 rounded-md">
          00:00:00
        </span>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">
        {dateStr}
      </span>
      <span className="text-[#1C1C1E]/40 text-xs">&middot;</span>
      <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#1C1C1E] font-semibold bg-[#1C1C1E]/5 px-2 py-0.5 border border-[#1C1C1E]/10">
        {timeStr}
      </span>
    </div>
  );
}

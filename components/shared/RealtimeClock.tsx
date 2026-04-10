"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function RealtimeClock({ className }: { className?: string }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date()); // Set initial time only on client

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <span className={cn("text-[10px] uppercase tracking-widest font-mono opacity-0", className)}>LOADING DATE...</span>;
  }

  // Format e.g., APRIL 08, 2026 • 14:32:01 PST
  // Using generic formatting because timezone abbr might not be reliably available across all browsers.
  const dateStr = time.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).toUpperCase();

  const timeStr = time.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 font-medium">
        {dateStr}
      </span>
      <span className="text-[#1C1C1E]/40 text-xs">•</span>
      <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#1C1C1E] font-semibold bg-[#1C1C1E]/5 px-2 py-0.5 border border-[#1C1C1E]/10">
        {timeStr}
      </span>
    </div>
  );
}

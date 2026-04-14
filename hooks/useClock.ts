"use client";

import { useEffect, useState } from "react";

/**
 * Returns a live Date object that updates every second.
 * Used for real-time clock displays.
 */
export function useClock() {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return time;
}

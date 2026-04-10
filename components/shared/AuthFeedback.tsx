"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useToast } from "./ToastProvider";

/**
 * Detects login/logout via URL search params and shows appropriate toast.
 * - `?welcome=1` → shown after login redirect
 * - `?signedout=1` → shown after logout redirect
 */
export function AuthFeedback() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    if (searchParams.get("welcome") === "1") {
      shown.current = true;
      toast("Welcome back! You're signed in.", "success");
      // Clean up the URL without triggering a navigation
      window.history.replaceState({}, "", pathname);
    }

    if (searchParams.get("signedout") === "1") {
      shown.current = true;
      toast("You've been signed out. See you soon!", "info");
      window.history.replaceState({}, "", pathname);
    }

    if (searchParams.get("registered") === "1") {
      shown.current = true;
      toast("Account created successfully! Please sign in.", "success");
      window.history.replaceState({}, "", pathname);
    }
  }, [searchParams, pathname, toast]);

  return null;
}

"use client";

import { createContext, useContext } from "react";
import toast from "react-hot-toast";

export type ToastType = "success" | "error" | "pending" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

// Keep context for backwards compatibility but it's no longer required
export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * useToast — proxies all calls to react-hot-toast under the hood.
 * Maintains the identical API surface so nothing else in the codebase breaks.
 */
export function useToast() {
  // Try context first for backwards compat, but fall back to direct react-hot-toast
  const ctx = useContext(ToastContext);

  const toastFn = (message: string, type: ToastType = "info") => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "pending":
        toast.loading(message);
        break;
      case "info":
      default:
        toast(message);
        break;
    }
  };

  const dismissFn = (id: string) => {
    toast.dismiss(id);
  };

  if (ctx) return ctx;

  return { toast: toastFn, dismiss: dismissFn };
}

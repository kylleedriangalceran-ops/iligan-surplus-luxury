"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "pending" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TOAST_DURATION = 4000;

const typeStyles: Record<ToastType, { bg: string; accent: string }> = {
  success: { bg: "bg-[#1C1C1E]", accent: "bg-emerald-400" },
  error: { bg: "bg-[#1C1C1E]", accent: "bg-red-400" },
  pending: { bg: "bg-[#1C1C1E]", accent: "bg-amber-400" },
  info: { bg: "bg-[#1C1C1E]", accent: "bg-[#FAF9F6]/60" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);

      if (type !== "pending") {
        setTimeout(() => dismiss(id), TOAST_DURATION);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast Container — top-right */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const isError = t.type === "error";
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "pointer-events-auto flex items-center gap-3 px-4 py-3 shadow-md max-w-sm min-w-[240px] rounded-sm border bg-[#FAF9F6]",
                  isError ? "border-red-500/20 text-red-600" : "border-[#1C1C1E]/10 text-[#1C1C1E]"
                )}
              >
                <p className="text-[10px] uppercase tracking-widest font-semibold flex-1 leading-relaxed">
                  {t.message}
                </p>

                <button
                  onClick={() => dismiss(t.id)}
                  className="opacity-50 hover:opacity-100 transition-opacity ml-2 shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

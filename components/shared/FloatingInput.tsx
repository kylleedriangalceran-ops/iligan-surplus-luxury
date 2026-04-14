"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingInputProps {
  id: string;
  name: string;
  type?: string;
  label: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  delay?: number;
}

export function FloatingInput({
  id,
  name,
  type = "text",
  label,
  required,
  minLength,
  icon,
  autoComplete,
  delay = 0,
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = isFocused || hasValue;
  const isPasswordType = type === "password";
  const currentType = isPasswordType && showPassword ? "text" : type;

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: delay * 0.08 }}
    >
      <div
        className="relative pt-5 pb-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Floating Label — positioned absolutely over the full row */}
        <motion.label
          htmlFor={id}
          className={cn(
            "absolute pointer-events-none origin-left font-medium uppercase tracking-widest transition-colors duration-300",
            icon ? "left-[30px]" : "left-0",
            isActive
              ? "text-[10px] text-[#1C1C1E]/70"
              : "text-xs text-[#1C1C1E]/40"
          )}
          animate={{
            y: isActive ? 0 : 26,
          }}
          style={{ top: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {label}
        </motion.label>

        {/* Icon + Input row */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          {icon && (
            <span
              className={cn(
                "shrink-0 transition-colors duration-300",
                isActive ? "text-[#1C1C1E]" : "text-[#1C1C1E]/30"
              )}
            >
              {icon}
            </span>
          )}

          {/* Input */}
          <div className="relative w-full">
            <input
              ref={inputRef}
              id={id}
              name={name}
              type={currentType}
              required={required}
              minLength={minLength}
              autoComplete={autoComplete}
              className={cn(
                "w-full bg-transparent border-none outline-none text-sm text-[#1C1C1E] py-1 placeholder:text-transparent focus:placeholder:text-[#1C1C1E]/30 transition-colors",
                isPasswordType && "pr-8" // Padding for toggle icon
              )}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                setIsFocused(false);
                setHasValue(e.target.value.length > 0);
              }}
              onChange={(e) => setHasValue(e.target.value.length > 0)}
            />
            
            {/* Password Toggle Icon */}
            {isPasswordType && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#1C1C1E]/40 hover:text-[#1C1C1E] transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom border — static */}
      <div className="h-px bg-[#1C1C1E]/15 w-full" />

      {/* Animated underline — expands from center on focus (Google-style) */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-[2px] bg-[#1C1C1E]"
        initial={{ width: 0, x: "-50%" }}
        animate={{
          width: isFocused ? "100%" : "0%",
          x: "-50%",
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
    </motion.div>
  );
}

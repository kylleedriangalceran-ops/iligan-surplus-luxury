"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Option {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label?: string; // Optional prefix, e.g. "Role:"
  options: Option[];
  value: string;
  onChange: (val: string) => void;
}

export function FilterDropdown({ label, options, value, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#FAF9F6] border border-[#1C1C1E]/10 rounded-md text-[10px] uppercase tracking-widest font-medium px-4 py-2.5 text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E]/30 transition-colors hover:bg-[#1C1C1E]/5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>
          {label && <span className="opacity-50 mr-1">{label}</span>}
          {selectedOption?.label}
        </span>
        <motion.svg 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="ml-1 opacity-50"
        >
          <path d="m6 9 6 6 6-6"/>
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 min-w-[160px] whitespace-nowrap bg-[#FAF9F6] border border-[#1C1C1E]/10 rounded-md shadow-lg overflow-hidden z-50 text-left"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 text-[10px] uppercase tracking-widest transition-colors ${
                    value === option.value 
                      ? "bg-[#1C1C1E]/5 text-[#1C1C1E] font-bold" 
                      : "text-[#1C1C1E]/70 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

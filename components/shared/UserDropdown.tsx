"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useClickOutside } from "@/hooks/useClickOutside";

interface UserDropdownProps {
  user: {
    name: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  };
  onLogout: () => void;
}

export function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none"
      >
        {/* Avatar circle */}
        <div className="w-9 h-9 rounded-full bg-[#1C1C1E]/5 border border-[#1C1C1E]/10 flex items-center justify-center text-[#1C1C1E] shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.5899 22C20.5899 18.134 16.7499 15 11.9999 15C7.24991 15 3.40991 18.134 3.40991 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {/* Name + chevron */}
        <span className="hidden md:flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#1C1C1E] font-medium">
          {user.name}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1C1C1E]/40">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-3 w-56 bg-[#FAF9F6] border border-[#1C1C1E]/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden z-50 text-left"
          >
            <div className="px-5 py-4 border-b border-[#1C1C1E]/10">
              <p className="text-sm font-semibold text-[#1C1C1E] truncate">{user.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/50 mt-1">
                {user.role}
              </p>
            </div>

            <div className="py-2">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="block px-5 py-2.5 text-xs uppercase tracking-widest text-[#1C1C1E]/70 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5 transition-colors"
              >
                Edit Profile
              </Link>
              {user.role === "CUSTOMER" && (
                <Link
                  href="/become-a-merchant"
                  onClick={() => setIsOpen(false)}
                  className="block px-5 py-2.5 text-xs uppercase tracking-widest text-[#1C1C1E]/70 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5 transition-colors"
                >
                  Become a Merchant
                </Link>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-5 py-2.5 text-xs uppercase tracking-widest text-[#1C1C1E]/70 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5 transition-colors focus:outline-none"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { registerUser } from "@/app/actions/register";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FloatingInput } from "@/components/shared/FloatingInput";

/* ── SVG icons for each field ── */
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" />
    <path d="M20.59 22c0-3.866-3.84-7-8.59-7s-8.59 3.134-8.59 7" />
  </svg>
);

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);



const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);
  const [role, setRole] = useState<"CUSTOMER" | "MERCHANT">("CUSTOMER");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-[#1C1C1E]">
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12 space-y-4">
          <motion.h1
            className="text-2xl font-light tracking-[0.15em] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Create Account
          </motion.h1>
          <motion.p
            className="text-xs text-[#1C1C1E]/50 uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join the curated surplus community
          </motion.p>
        </div>

        <form action={formAction} className="space-y-2">
          
          {/* Segmented Control for Role */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <input type="hidden" name="role" value={role} />
            <div className="relative flex w-full border-b border-[#1C1C1E]/10">
              
              {/* Underline animation indicator */}
              <motion.div
                className="absolute bottom-[-1px] h-[1px] w-1/2 bg-[#1C1C1E] z-10"
                initial={false}
                animate={{
                  x: role === "CUSTOMER" ? 0 : "100%",
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />

              <button
                type="button"
                className={cn(
                  "relative flex-1 py-4 text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-300",
                  role === "CUSTOMER" ? "text-[#1C1C1E]" : "text-[#1C1C1E]/40 hover:text-[#1C1C1E]/70"
                )}
                onClick={() => setRole("CUSTOMER")}
              >
                Customer
              </button>
              
              <button
                type="button"
                className={cn(
                  "relative flex-1 py-4 text-xs uppercase tracking-[0.2em] font-medium transition-colors duration-300",
                  role === "MERCHANT" ? "text-[#1C1C1E]" : "text-[#1C1C1E]/40 hover:text-[#1C1C1E]/70"
                )}
                onClick={() => setRole("MERCHANT")}
              >
                Merchant
              </button>
            </div>
          </motion.div>

          {/* Form fields with Google-style floating labels & icons */}
          <div className="space-y-6">
            <FloatingInput
              id="name"
              name="name"
              type="text"
              label="Full Name"
              required
              icon={<UserIcon />}
              placeholder="e.g. John Doe"
              delay={1}
            />

            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              required
              icon={<MailIcon />}
              autoComplete="email"
              placeholder="e.g. email@example.com"
              delay={2}
            />

            <FloatingInput
              id="phone"
              name="phone"
              type="tel"
              label="Phone Number"
              icon={<PhoneIcon />}
              placeholder="e.g. +63 900 000 0000"
              delay={3}
            />

            <FloatingInput
              id="password"
              name="password"
              type="password"
              label="Password"
              required
              minLength={6}
              icon={<LockIcon />}
              placeholder="Min. 6 characters"
              delay={4}
            />

            {/* Merchant-specific extra fields */}
            {role === "MERCHANT" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden pt-2"
              >
                <FloatingInput
                  id="storeName"
                  name="storeName"
                  type="text"
                  label="Store Name"
                  required={role === "MERCHANT"}
                  icon={<StoreIcon />}
                  placeholder="e.g. Luxe Boutique"
                  delay={1}
                />

                <FloatingInput
                  id="address"
                  name="address"
                  type="text"
                  label="Store Address"
                  required={role === "MERCHANT"}
                  icon={<MapPinIcon />}
                  placeholder="e.g. Tibanga, Iligan City"
                  delay={2}
                />

                <FloatingInput
                  id="socialMedia"
                  name="socialMedia"
                  type="url"
                  label="Social Media or Website"
                  icon={<LinkIcon />}
                  placeholder="e.g. https://instagram.com/luxeboutique"
                  delay={3}
                />
              </motion.div>
            )}
          </div>

          {/* Application Error State */}
          {state?.error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-center font-medium bg-red-50 text-red-600 p-3 border border-red-200 mt-6 tracking-widest uppercase"
            >
              {state.error}
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.div
            className="pt-8 flex flex-col space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="w-full group relative flex items-center justify-center p-4 disabled:opacity-50 overflow-hidden border border-[#1C1C1E] bg-[#1C1C1E] text-[#FAF9F6] hover:bg-transparent hover:text-[#1C1C1E] transition-all duration-500"
            >
              <span className="relative text-xs uppercase tracking-[0.25em] font-medium z-10">
                {isPending ? "Creating Account..." : "Register"}
              </span>
            </button>

            <Link href="/login" className="text-center text-[10px] uppercase tracking-widest text-[#1C1C1E]/50 hover:text-[#1C1C1E] transition-colors block">
              Already have an account? Log in
            </Link>
          </motion.div>
        </form>

        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-[10px] text-[#1C1C1E] uppercase tracking-widest">
            Iligan Surplus Luxury
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

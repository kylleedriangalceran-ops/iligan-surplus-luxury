"use client";

import React, { useActionState } from "react";
import { motion } from "framer-motion";
import { registerUser } from "@/app/actions/register";
import Link from "next/link";
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



export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center p-6 text-[#1C1C1E] bg-background">
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8 space-y-2">
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

        <form action={formAction} className="space-y-4">
          
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
              className="w-full group relative flex items-center justify-center p-4 disabled:opacity-50 overflow-hidden rounded-md border border-[#1C1C1E] bg-[#1C1C1E] text-[#FAF9F6] hover:bg-transparent hover:text-[#1C1C1E] transition-all duration-500"
            >
              <span className="relative text-xs uppercase tracking-[0.25em] font-medium z-10">
                {isPending ? "Creating Account..." : "Register"}
              </span>
            </button>

            <p className="text-center text-[10px] uppercase tracking-widest text-[#1C1C1E]/50 block">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-[#1C1C1E] transition-colors">
                Log in
              </Link>
            </p>
          </motion.div>
        </form>

        <motion.div
          className="mt-8 text-center"
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

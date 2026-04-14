"use client";

import React, { useActionState } from "react";
import { motion } from "framer-motion";
import { loginUser } from "@/app/actions/auth";
import Link from "next/link";
import { FloatingInput } from "@/components/shared/FloatingInput";

/* ── SVG icons ── */
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);



export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginUser, null);

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center p-6 text-[#1C1C1E] bg-background">
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 space-y-2">
          <motion.h1
            className="text-2xl font-light tracking-[0.15em] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p
            className="text-xs text-[#1C1C1E]/50 uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Log in to your account
          </motion.p>
        </div>

        <form action={formAction} className="space-y-2">
          {/* Form fields with Google-style floating labels & icons */}
          <div className="space-y-6">
            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              required
              icon={<MailIcon />}
              autoComplete="email"
              placeholder="e.g. email@example.com"
              delay={1}
            />

            <FloatingInput
              id="password"
              name="password"
              type="password"
              label="Password"
              required
              placeholder="Enter your password"
              icon={<LockIcon />}
              delay={2}
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-4 h-4 border border-[#1C1C1E]/30 bg-transparent transition-colors group-hover:border-[#1C1C1E]">
                <input type="checkbox" name="remember" className="peer sr-only" />
                <svg className="w-3 h-3 text-[#1C1C1E] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 group-hover:text-[#1C1C1E] transition-colors">
                Remember me
              </span>
            </label>
            <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 hover:text-[#1C1C1E] transition-colors">
              Forgot Password?
            </Link>
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
            className="pt-10 flex flex-col space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <button
              type="submit"
              disabled={isPending}
              className="w-full group relative flex items-center justify-center p-4 rounded-md disabled:opacity-50 overflow-hidden"
            >
              {/* Button Background Transition */}
              <div className="absolute inset-0 bg-[#1C1C1E] transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
              
              <span className="relative text-[#FAF9F6] text-xs uppercase tracking-[0.25em] font-medium z-10 transition-transform duration-500 group-hover:tracking-[0.3em]">
                {isPending ? "Authenticating..." : "Log In"}
              </span>
            </button>

            <p className="text-center text-[10px] uppercase tracking-widest text-[#1C1C1E]/50 block">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline hover:text-[#1C1C1E] transition-colors">
                Register
              </Link>
            </p>
          </motion.div>
        </form>

        <motion.div
          className="mt-10 text-center"
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

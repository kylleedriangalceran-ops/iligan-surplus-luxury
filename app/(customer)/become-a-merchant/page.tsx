"use client";

import React, { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitMerchantApplication } from "@/app/actions/application";
import { FloatingInput } from "@/components/shared/FloatingInput";
import Link from "next/link";

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

export default function BecomeAMerchantPage() {
  const [state, formAction, isPending] = useActionState(submitMerchantApplication, null);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-[#1C1C1E]">
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {state?.success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-4">Application Sent</h2>
              <p className="text-xs text-[#1C1C1E]/60 leading-relaxed mb-8">
                Your merchant application has been submitted to our team for review. You will be notified once a decision is made.
              </p>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center px-6 py-3 border border-[#1C1C1E] bg-transparent text-[#1C1C1E] text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-colors"
              >
                Return to Feed
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
              {/* Header */}
              <div className="flex flex-col items-center text-center mb-12 space-y-4">
                <h1 className="text-2xl font-light tracking-[0.15em] uppercase">
                  Become a Merchant
                </h1>
                <p className="text-xs text-[#1C1C1E]/50 uppercase tracking-widest leading-relaxed">
                  Apply to list your surplus inventory
                </p>
              </div>

              <form action={formAction} className="space-y-6">
                <FloatingInput
                  id="storeName"
                  name="storeName"
                  type="text"
                  label="Store Name"
                  required
                  icon={<StoreIcon />}
                  placeholder="e.g. Luxe Boutique"
                  delay={1}
                />

                <FloatingInput
                  id="address"
                  name="address"
                  type="text"
                  label="Store Address"
                  required
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

                {/* Application Error State */}
                {state?.error && (
                  <p className="text-[10px] text-center font-medium bg-red-50 text-red-600 p-3 border border-red-200 mt-6 tracking-widest uppercase">
                    {state.error}
                  </p>
                )}

                {/* Submit Button */}
                <div className="pt-4 flex flex-col space-y-6">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full mt-2 relative flex items-center justify-center px-8 py-4 border border-[#1C1C1E] bg-transparent rounded-[10px] text-[#1C1C1E] hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all duration-300 disabled:opacity-50"
                  >
                    <span className="text-xs uppercase tracking-[0.25em] font-medium">
                      {isPending ? "Submitting..." : "Submit Application"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

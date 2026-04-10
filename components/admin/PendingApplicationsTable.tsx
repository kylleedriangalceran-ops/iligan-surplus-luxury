"use client";

import React, { useTransition } from "react";
import { approveMerchantApplication, rejectMerchantApplication } from "@/app/actions/admin";

interface MerchantApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  storeName: string;
  address: string;
  socialMedia: string | null;
  status: string;
  createdAt: Date;
}

export function PendingApplicationsTable({ applications }: { applications: MerchantApplication[] }) {
  if (applications.length === 0) {
    return (
      <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6] p-12 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest text-[#1C1C1E]/40 font-medium">No Pending Applications</p>
        <p className="text-[10px] text-[#1C1C1E]/30 mt-1">All merchant applications have been processed</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6] divide-y divide-[#1C1C1E]/5">
      {applications.map((app) => (
        <ApplicationRow key={app.id} application={app} />
      ))}
    </div>
  );
}

function ApplicationRow({ application }: { application: MerchantApplication }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveMerchantApplication(application.id);
    });
  };

  const handleReject = () => {
    if (!confirm(`Reject ${application.userName}'s application for "${application.storeName}"?`)) return;
    startTransition(async () => {
      await rejectMerchantApplication(application.id);
    });
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(application.address + ", Iligan City")}`;

  return (
    <div className={`p-6 transition-opacity ${isPending ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-xs font-bold text-amber-600 uppercase shrink-0">
              {application.userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1C1C1E] truncate">{application.userName}</p>
              <p className="text-[10px] text-[#1C1C1E]/40 truncate">{application.userEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {/* Store Name */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold">Store Name</p>
              <p className="text-xs text-[#1C1C1E] font-medium">{application.storeName}</p>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold">Address</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#1C1C1E] underline underline-offset-2 decoration-[#1C1C1E]/20 hover:decoration-[#1C1C1E]/60 transition-colors inline-flex items-center gap-1"
              >
                {application.address}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            {/* Social Media */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold">Social Media</p>
              {application.socialMedia ? (
                <a
                  href={application.socialMedia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#1C1C1E] underline underline-offset-2 decoration-[#1C1C1E]/20 hover:decoration-[#1C1C1E]/60 transition-colors truncate block"
                >
                  {application.socialMedia.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <p className="text-xs text-[#1C1C1E]/30 italic">Not provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="px-5 py-2.5 bg-[#1C1C1E] text-[#FAF9F6] text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#1C1C1E]/80 transition-colors disabled:opacity-40"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="px-5 py-2.5 border border-red-300 text-red-500 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            Reject
          </button>
        </div>
      </div>

      <p className="text-[10px] text-[#1C1C1E]/30 mt-3">
        Applied {new Date(application.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

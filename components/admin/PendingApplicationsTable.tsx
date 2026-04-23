"use client";

import React, { useTransition, useState, useCallback, useOptimistic } from "react";
import        { approveMerchantApplication, rejectMerchantApplication } from "@/app/actions/admin";
import        { usePagination } from "@/hooks/usePagination";
import        { FilterDropdown } from "@/components/shared/FilterDropdown";
import        {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [optimisticApps, addOptimisticApp] = useOptimistic(
    applications,
    (state: MerchantApplication[], deletedId: string) => state.filter((app) => app.id !== deletedId)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");

  const filterFn = useCallback(
    (app: MerchantApplication, q: string) => {
      const matchesSearch = app.userName.toLowerCase().includes(q) ||
        app.userEmail.toLowerCase().includes(q) ||
        app.storeName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    },
    [statusFilter]
  );

  const sortedApps = React.useMemo(() => {
    const list = [...optimisticApps];
    if (sortFilter === "OLDEST") return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    // NEWEST by default
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [optimisticApps, sortFilter]);

  const {
    filteredItems: filteredApps,
    paginatedItems: paginatedApps,
    currentPage,
    totalPages,
    setCurrentPage,
    showingFrom,
    showingTo,
    totalFiltered,
  } = usePagination({ items: sortedApps, itemsPerPage: 5, searchQuery, filterFn });

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center w-full max-w-md">
          <div className="flex items-center justify-center w-10 h-10 border border-[#1C1C1E]/10 rounded-l-md bg-white/50 text-[#1C1C1E]/40 shrink-0">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white/50 border-y border-r border-[#1C1C1E]/10 rounded-r-md h-10 text-xs font-medium tracking-wide text-[#1C1C1E] outline-none transition-colors focus:border-[#1C1C1E]/30 placeholder:text-[#1C1C1E]/30 placeholder:uppercase placeholder:tracking-widest"
          />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <FilterDropdown
            label="Status:"
            options={[
              { label: "All Statuses", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Sort:"
            options={[
              { label: "Newest First", value: "NEWEST" },
              { label: "Oldest First", value: "OLDEST" },
            ]}
            value={sortFilter}
            onChange={setSortFilter}
          />
        </div>
      </div>

      <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6]">
        {/* Header */}
        <div className="hidden lg:grid grid-cols-[1.5fr_1.5fr_1fr_150px] gap-4 px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#1C1C1E]/3">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Applicant</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Store Details</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Social / Applied</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Actions</span>
        </div>

        {/* Rows */}
        {filteredApps.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs text-[#1C1C1E]/40">No pending applications match your search.</p>
          </div>
        ) : (
          paginatedApps.map((app) => (
            <ApplicationRow 
              key={app.id} 
              application={app} 
              onProcessed={addOptimisticApp} 
            />
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 px-6 flex items-center justify-between border-t border-[#1C1C1E]/10 bg-[#FAF9F6]">
            <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-medium">
              Showing {showingFrom}-{showingTo} of {totalFiltered}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all"
              >
                Prev
              </button>
              <div className="flex items-center justify-center px-2 py-1.5 text-[10px] font-medium">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium border border-[#1C1C1E]/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1C1C1E] hover:text-[#FAF9F6] transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationRow({ application, onProcessed }: { application: MerchantApplication, onProcessed: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        onProcessed(application.id);
        await approveMerchantApplication(application.id);
      } catch (err) {
        console.error("Failed to approve:", err);
        setError("Failed to approve. The application may have already been processed.");
      }
    });
  };

  const handleReject = () => {
    setError(null);
    setShowRejectDialog(false);
    startTransition(async () => {
      try {
        onProcessed(application.id);
        await rejectMerchantApplication(application.id);
      } catch (err) {
        console.error("Failed to reject:", err);
        setError("Failed to reject. The application may have already been processed.");
      }
    });
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(application.address + ", Iligan City")}`;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[1.5fr_1.5fr_1fr_150px] gap-4 px-6 py-5 border-b border-[#1C1C1E]/5 last:border-b-0 hover:bg-white/50 transition-colors ${isPending ? "opacity-40 pointer-events-none" : ""}`}>
      {/* Applicant */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-600 uppercase shrink-0">
          {application.userName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1C1C1E] truncate">{application.userName}</p>
          <p className="text-[10px] text-[#1C1C1E]/40 truncate">{application.userEmail}</p>
        </div>
      </div>

      {/* Store Details */}
      <div className="flex flex-col justify-center min-w-0">
        <p className="text-xs text-[#1C1C1E] font-medium truncate">{application.storeName}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#1C1C1E] underline underline-offset-2 decoration-[#1C1C1E]/20 hover:decoration-[#1C1C1E]/60 transition-colors inline-flex items-center gap-1 mt-0.5 truncate"
        >
          {application.address}
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* Social Media & Date */}
      <div className="flex flex-col justify-center min-w-0">
        {application.socialMedia ? (
          <a
            href={application.socialMedia}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#1C1C1E] underline underline-offset-2 decoration-[#1C1C1E]/20 hover:decoration-[#1C1C1E]/60 transition-colors truncate block"
          >
            {application.socialMedia.replace(/^https?:\/\//, "")}
          </a>
        ) : (
          <p className="text-[10px] text-[#1C1C1E]/30 italic truncate">No link provided</p>
        )}
        <p className="text-[9px] text-[#1C1C1E]/40 mt-1 uppercase tracking-widest truncate">
          {new Date(application.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-stretch gap-1.5 self-center">
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 py-1.5 px-2 rounded-md bg-emerald-600 border border-emerald-600 text-[#FAF9F6] text-[9px] uppercase tracking-widest font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            Approve
          </button>
          <button
            onClick={() => setShowRejectDialog(true)}
            disabled={isPending}
            className="flex-1 py-1.5 px-2 rounded-md border border-red-300 text-red-500 text-[9px] uppercase tracking-widest font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            Reject
          </button>
        </div>
        {error && (
          <p className="text-[9px] text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="bg-[#FAF9F6] border-[#1C1C1E]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1C1C1E] text-base font-semibold">
              Reject Application
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1C1C1E]/60 text-sm">
              Reject {application.userName}&apos;s application for &quot;{application.storeName}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#1C1C1E]/20 text-[#1C1C1E] hover:bg-[#1C1C1E]/5 text-xs uppercase tracking-widest font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-red-600 text-white hover:bg-red-700 text-xs uppercase tracking-widest font-medium"
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

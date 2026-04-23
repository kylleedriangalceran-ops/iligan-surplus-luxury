"use client";

import React, { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { changeUserRole, removeUser, suspendUser } from "@/app/actions/admin";
import { usePagination } from "@/hooks/usePagination";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isBanned: boolean;
  createdAt: Date;
}

const roleColors: Record<string, string> = {
  ADMIN: "text-violet-600 bg-violet-50 border-violet-200",
  MERCHANT: "text-amber-600 bg-amber-50 border-amber-200",
  CUSTOMER: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

export function AdminUserManagement({
  users,
  sessionUserId,
}: {
  users: AdminUser[];
  sessionUserId: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filterFn = useCallback(
    (user: AdminUser, q: string) => {
      const matchesSearch = user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus = statusFilter === "ALL" || 
        (statusFilter === "ACTIVE" && !user.isBanned) ||
        (statusFilter === "SUSPENDED" && user.isBanned);

      return matchesSearch && matchesRole && matchesStatus;
    },
    [roleFilter, statusFilter]
  );

  const {
    filteredItems: filteredUsers,
    paginatedItems: paginatedUsers,
    currentPage,
    totalPages,
    setCurrentPage,
    showingFrom,
    showingTo,
    totalFiltered,
  } = usePagination({ items: users, itemsPerPage: 8, searchQuery, filterFn });

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
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white/50 border-y border-r border-[#1C1C1E]/10 rounded-r-md h-10 text-xs font-medium tracking-wide text-[#1C1C1E] outline-none transition-colors focus:border-[#1C1C1E]/30 placeholder:text-[#1C1C1E]/30 placeholder:uppercase placeholder:tracking-widest"
          />
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <FilterDropdown
            label="Role:"
            options={[
              { label: "All Roles", value: "ALL" },
              { label: "Admin", value: "ADMIN" },
              { label: "Merchant", value: "MERCHANT" },
              { label: "Customer", value: "CUSTOMER" },
            ]}
            value={roleFilter}
            onChange={setRoleFilter}
          />
          <FilterDropdown
            label="Status:"
            options={[
              { label: "All Statuses", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Suspended", value: "SUSPENDED" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6]">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_100px_130px_200px] gap-4 px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#1C1C1E]/3">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Name</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Email</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40 text-center">Role</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40 text-center">Joined</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40 text-center">Actions</span>
        </div>

        {/* Rows */}
        {filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs text-[#1C1C1E]/40">No users match your search.</p>
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === sessionUserId} />
          ))
        )}

        {/* Pagination logic */}
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

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleRoleChange = (newRole: "MERCHANT" | "CUSTOMER" | "ADMIN") => {
    startTransition(async () => {
      await changeUserRole(user.id, newRole);
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    startTransition(async () => {
      await removeUser(user.id);
    });
  };

  const handleSuspend = () => {
    setShowSuspendDialog(false);
    startTransition(async () => {
      await suspendUser(user.id, !user.isBanned);
    });
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-[1fr_1.5fr_100px_130px_200px] gap-2 md:gap-4 px-6 py-5 border-b border-[#1C1C1E]/5 last:border-b-0 hover:bg-white/50 transition-all ${
        isPending ? "opacity-40 pointer-events-none" : ""
      } ${user.isBanned ? "bg-red-50/50" : ""}`}
    >
      {/* Name */}
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0 ${
          user.isBanned
            ? "bg-red-100 border border-red-200 text-red-500"
            : "bg-[#1C1C1E]/5 border border-[#1C1C1E]/10 text-[#1C1C1E]/50"
        }`}>
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium text-[#1C1C1E] truncate block">
            {user.name}
            {isSelf && <span className="text-[10px] ml-1 text-[#1C1C1E]/40">(you)</span>}
          </span>
          {user.isBanned && (
            <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Suspended</span>
          )}
        </div>
      </div>

      {/* Email */}
      <span className="text-xs text-[#1C1C1E]/60 truncate self-center">{user.email}</span>

      {/* Role */}
      <div className="flex justify-center self-center w-full">
        <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 border ${roleColors[user.role] || ""}`}>
          {user.role}
        </span>
      </div>

      {/* Joined */}
      <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 self-center text-center">
        {new Date(user.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
      </span>

      {/* Actions */}
      <div className="w-full flex items-center justify-center gap-4 self-center">
        {!isSelf && (
          <>
            {/* Edit Role */}
            <div className="relative group" ref={dropdownRef}>
              <button
                disabled={isPending}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Edit User Role"
                className={`flex items-center justify-center transition-colors disabled:opacity-40 ${
                  isDropdownOpen ? "text-[#1C1C1E]" : "text-[#1C1C1E]/40 hover:text-[#1C1C1E]"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-32 bg-[#FAF9F6] border border-[#1C1C1E]/10 rounded-md shadow-lg z-50 overflow-hidden"
                  >
                    {(["CUSTOMER", "MERCHANT", "ADMIN"] as const).map((roleOption) => (
                      <button
                        key={roleOption}
                        disabled={isPending || user.role === roleOption}
                        onClick={() => {
                          handleRoleChange(roleOption);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-widest font-medium transition-colors ${
                          user.role === roleOption
                            ? "bg-[#1C1C1E]/5 text-[#1C1C1E]"
                            : "text-[#1C1C1E]/60 hover:bg-[#1C1C1E]/5 hover:text-[#1C1C1E]"
                        } disabled:opacity-40`}
                      >
                        {roleOption}
                        {user.role === roleOption && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suspend */}
            <button
              onClick={() => setShowSuspendDialog(true)}
              disabled={isPending}
              title={user.isBanned ? "Unsuspend User" : "Suspend User"}
              className={`flex items-center justify-center transition-colors disabled:opacity-40 ${
                user.isBanned
                  ? "text-emerald-500 hover:text-emerald-600"
                  : "text-amber-500 hover:text-amber-600"
              }`}
            >
              {user.isBanned ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={isPending}
              title="Delete User"
              className="flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#FAF9F6] border-[#1C1C1E]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1C1C1E] text-base font-semibold">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1C1C1E]/60 text-sm">
              Permanently delete {user.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#1C1C1E]/20 text-[#1C1C1E] hover:bg-[#1C1C1E]/5 text-xs uppercase tracking-widest font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 text-xs uppercase tracking-widest font-medium"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Unsuspend Confirmation Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent className="bg-[#FAF9F6] border-[#1C1C1E]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1C1C1E] text-base font-semibold">
              {user.isBanned ? "Unsuspend" : "Suspend"} User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1C1C1E]/60 text-sm">
              {user.isBanned ? "Unsuspend" : "Suspend"} {user.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#1C1C1E]/20 text-[#1C1C1E] hover:bg-[#1C1C1E]/5 text-xs uppercase tracking-widest font-medium">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSuspend}
              className={`text-white text-xs uppercase tracking-widest font-medium ${
                user.isBanned
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {user.isBanned ? "Unsuspend" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

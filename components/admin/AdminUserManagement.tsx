"use client";

import React, { useState, useTransition } from "react";
import { changeUserRole, removeUser, suspendUser } from "@/app/actions/admin";

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

  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1C1C1E]/30"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full bg-[#FAF9F6] border border-[#1C1C1E]/10 pl-10 pr-4 py-3 text-xs text-[#1C1C1E] placeholder:text-[#1C1C1E]/30 focus:outline-none focus:border-[#1C1C1E]/30 transition-colors"
          />
          {searchQuery && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#1C1C1E]/40">
              {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1C1C1E]/10 bg-[#FAF9F6]">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_100px_130px_200px] gap-4 px-6 py-4 border-b border-[#1C1C1E]/10 bg-[#1C1C1E]/3">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Name</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Email</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Role</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Joined</span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40">Actions</span>
        </div>

        {/* Rows */}
        {filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs text-[#1C1C1E]/40">No users match your search.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserRow key={user.id} user={user} isSelf={user.id === sessionUserId} />
          ))
        )}
      </div>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: "MERCHANT" | "CUSTOMER" | "ADMIN") => {
    startTransition(async () => {
      await changeUserRole(user.id, newRole);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Permanently delete ${user.name}? This action cannot be undone.`)) return;
    startTransition(async () => {
      await removeUser(user.id);
    });
  };

  const handleSuspend = () => {
    const action = user.isBanned ? "unsuspend" : "suspend";
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.name}?`)) return;
    startTransition(async () => {
      await suspendUser(user.id, !user.isBanned);
    });
  };

  const roles: ("CUSTOMER" | "MERCHANT" | "ADMIN")[] = ["CUSTOMER", "MERCHANT", "ADMIN"];

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
      <span className="self-center">
        <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 border ${roleColors[user.role] || ""}`}>
          {user.role}
        </span>
      </span>

      {/* Joined */}
      <span className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 self-center">
        {new Date(user.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
      </span>

      {/* Actions */}
      <div className="self-center flex items-center gap-3">
        <select
          value={user.role}
          disabled={isPending || isSelf}
          onChange={(e) => handleRoleChange(e.target.value as "MERCHANT" | "CUSTOMER" | "ADMIN")}
          className="bg-transparent border border-[#1C1C1E]/15 text-[10px] uppercase tracking-widest font-medium px-3 py-2 text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] disabled:opacity-40 cursor-pointer appearance-none"
        >
          {roles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        {!isSelf && (
          <>
            <button
              onClick={handleSuspend}
              disabled={isPending}
              className={`text-[10px] uppercase tracking-widest font-medium transition-colors disabled:opacity-40 ${
                user.isBanned
                  ? "text-emerald-600 hover:text-emerald-700"
                  : "text-amber-500 hover:text-amber-600"
              }`}
            >
              {user.isBanned ? "Unsuspend" : "Suspend"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-[10px] uppercase tracking-widest font-medium text-red-500/70 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

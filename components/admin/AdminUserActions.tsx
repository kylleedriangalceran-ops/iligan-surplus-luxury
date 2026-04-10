"use client";

import React, { useTransition } from "react";
import { changeUserRole, removeUser } from "@/app/actions/admin";

interface AdminUserActionsProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export function AdminUserActions({ userId, currentRole, isSelf }: AdminUserActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: "MERCHANT" | "CUSTOMER" | "ADMIN") => {
    startTransition(async () => {
      await changeUserRole(userId, newRole);
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    startTransition(async () => {
      await removeUser(userId);
    });
  };

  const roles: ("CUSTOMER" | "MERCHANT" | "ADMIN")[] = ["CUSTOMER", "MERCHANT", "ADMIN"];

  return (
    <div className="flex items-center gap-3">
      <select
        value={currentRole}
        disabled={isPending || isSelf}
        onChange={(e) => handleRoleChange(e.target.value as "MERCHANT" | "CUSTOMER" | "ADMIN")}
        className="bg-transparent border border-[#1C1C1E]/15 text-[10px] uppercase tracking-widest font-medium px-3 py-2 text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] disabled:opacity-40 cursor-pointer appearance-none"
      >
        {roles.map((role) => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>

      {!isSelf && (
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[10px] uppercase tracking-widest font-medium text-red-500/70 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          {isPending ? "..." : "Remove"}
        </button>
      )}
    </div>
  );
}

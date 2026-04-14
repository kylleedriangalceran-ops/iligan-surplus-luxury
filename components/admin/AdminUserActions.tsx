"use client";

import React, { useTransition, useState, useRef, useCallback } from "react";
import { changeUserRole, removeUser } from "@/app/actions/admin";
import { motion, AnimatePresence } from "framer-motion";
import { useClickOutside } from "@/hooks/useClickOutside";
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

interface AdminUserActionsProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

const roles: ("CUSTOMER" | "MERCHANT" | "ADMIN")[] = ["CUSTOMER", "MERCHANT", "ADMIN"];

export function AdminUserActions({ userId, currentRole, isSelf }: AdminUserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, useCallback(() => setIsOpen(false), []));

  const handleRoleChange = (newRole: "MERCHANT" | "CUSTOMER" | "ADMIN") => {
    if (newRole === currentRole) return;
    startTransition(async () => {
      await changeUserRole(userId, newRole);
    });
    setIsOpen(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(false);
    startTransition(async () => {
      await removeUser(userId);
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Custom Animated Role Select */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !isSelf && !isPending && setIsOpen(!isOpen)}
          disabled={isPending || isSelf}
          className="flex items-center gap-2 bg-transparent border border-[#1C1C1E]/15 rounded text-[10px] uppercase tracking-widest font-medium px-3 py-2 text-[#1C1C1E] focus:outline-none focus:border-[#1C1C1E] disabled:opacity-40 transition-colors hover:bg-[#1C1C1E]/5"
        >
          {isPending ? "Updating..." : currentRole}
          {!isSelf && (
            <motion.svg 
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6"/>
            </motion.svg>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 w-32 bg-[#FAF9F6] border border-[#1C1C1E]/10 rounded shadow-lg overflow-hidden z-50 text-left"
            >
              <div className="py-1">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`block w-full text-left px-4 py-2 text-[10px] uppercase tracking-widest transition-colors ${
                      currentRole === role 
                        ? "bg-[#1C1C1E]/5 text-[#1C1C1E] font-bold" 
                        : "text-[#1C1C1E]/70 hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/5"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isSelf && (
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
          className="text-[10px] uppercase tracking-widest font-medium text-red-500/70 hover:text-red-600 transition-colors disabled:opacity-40 bg-red-50 px-3 py-2 rounded border border-red-100 opacity-80 hover:opacity-100"
        >
          {isPending ? "..." : "Remove"}
        </button>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#FAF9F6] border-[#1C1C1E]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1C1C1E] text-base font-semibold">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1C1C1E]/60 text-sm">
              Are you sure you want to delete this user? This action cannot be undone.
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
    </div>
  );
}

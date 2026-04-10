"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "@/app/actions/auth";

import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserDropdown } from "@/components/shared/UserDropdown";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    // Calling the server action without arguments
    await logoutUser();
  };

  return (
    <header className="w-full fixed top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-sans text-xl font-medium tracking-tight">
          RESERVE.
        </Link>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-5 ml-auto">
          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <UserDropdown user={user} onLogout={handleLogout} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              {pathname !== "/login" && (
                <Link
                  href="/login"
                  className="text-[11px] uppercase tracking-widest font-medium py-2.5 px-5 border border-foreground/10 hover:border-foreground transition-all duration-300"
                >
                  Log In
                </Link>
              )}
              {pathname !== "/register" && (
                <Link
                  href="/register"
                  className="text-[11px] uppercase tracking-widest font-medium py-2.5 px-5 bg-foreground text-background hover:bg-foreground/80 transition-all duration-300"
                >
                  Register
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <motion.span
            className="block w-5 h-[1.5px] bg-foreground origin-center"
            animate={mobileOpen ? { rotate: 45, y: 3 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.span
            className="block w-5 h-[1.5px] bg-foreground origin-center"
            animate={mobileOpen ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3 }}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-background border-b border-border/30"
          >
            <nav className="flex flex-col px-6 py-8 gap-6">
              <Link
                href="/feed"
                onClick={() => setMobileOpen(false)}
                className="text-sm uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Curated
              </Link>
              {user && (
                <Link
                  href="/reservations"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Reserves
                </Link>
              )}
              {user && (user.role === "MERCHANT" || user.role === "ADMIN") && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              )}
              {user && user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  Admin
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </Link>
              )}
              <div className="pt-4 border-t border-border/40">
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                  >
                    Sign Out — {user.name}
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log In
                  </Link>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

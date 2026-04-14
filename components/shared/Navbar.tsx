"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { logoutUser } from "@/app/actions/auth";

import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserDropdown } from "@/components/shared/UserDropdown";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  } | null;
  onHamburgerToggle?: () => void;
  hamburgerOpen?: boolean;
}

export function Navbar({ user, onHamburgerToggle, hamburgerOpen = false }: NavbarProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <header className="w-full fixed top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Hamburger (mobile only, only when sidebar exists) + Logo */}
        <div className="flex items-center gap-4">
          {user && !isAuthPage && (
            <button
              className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#1C1C1E]/10 bg-[#FAF9F6]/80 transition-all duration-300 hover:border-[#1C1C1E]/30 hover:bg-[#FAF9F6]"
              onClick={onHamburgerToggle}
              aria-label="Toggle sidebar"
            >
              <div className="relative flex h-4 w-4 items-center justify-center">
                <motion.span
                  className="absolute block w-4 h-[1.5px] bg-foreground origin-center"
                  animate={hamburgerOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -3 }}
                  transition={{ duration: 0.25 }}
                />
                <motion.span
                  className="absolute block w-4 h-[1.5px] bg-foreground origin-center"
                  animate={hamburgerOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 3 }}
                  transition={{ duration: 0.25 }}
                />
              </div>
            </button>
          )}

          <Link href="/" className="font-sans text-xl font-medium tracking-tight">
            RESERVE.
          </Link>
        </div>

        {/* Right: Desktop Auth */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
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
                  className="text-[11px] uppercase tracking-widest font-medium py-2.5 px-5 border border-foreground/10 hover:border-foreground transition-all duration-300 rounded-md"
                >
                  Log In
                </Link>
              )}
              {pathname !== "/register" && (
                <Link
                  href="/register"
                  className="text-[11px] uppercase tracking-widest font-medium py-2.5 px-5 bg-foreground text-background hover:bg-foreground/80 transition-all duration-300 rounded-md"
                >
                  Register
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Mobile: Notification + User (when logged in) */}
        <div className="md:hidden flex items-center gap-2">
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
                  className="text-[11px] uppercase tracking-widest font-medium py-2 px-4 border border-foreground/10 hover:border-foreground transition-all duration-300 rounded-md"
                >
                  Log In
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

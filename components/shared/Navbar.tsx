"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "@/app/actions/auth";

import { NotificationBell } from "@/components/shared/NotificationBell";
import { UserDropdown } from "@/components/shared/UserDropdown";
import { cn } from "@/lib/utils";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/SurePlus+.png" 
              alt="SurePlus+" 
              style={{ height: "64px", width: "auto", display: "block" }}
              className="hover:opacity-80 transition-opacity" 
            />
          </Link>
        </div>

        {/* Right: Desktop Auth */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          {user ? (
            <>
              <NotificationBell userId={user.id} userRole={user.role} />
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

        {/* Mobile: Notification + User / Hamburger when unauthenticated */}
        <div className="md:hidden flex items-center gap-2 relative">
          {user ? (
            <>
              <NotificationBell userId={user.id} userRole={user.role} />
              <UserDropdown user={user} onLogout={handleLogout} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                className="flex items-center justify-center p-2 text-foreground focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <div className="relative flex flex-col justify-between h-4 w-5">
                  <span className={cn("block h-[1.5px] w-full bg-foreground transition-all duration-300", mobileMenuOpen ? "rotate-45 translate-y-[7px]" : "")} />
                  <span className={cn("block h-[1.5px] w-full bg-foreground transition-all duration-300", mobileMenuOpen ? "opacity-0" : "")} />
                  <span className={cn("block h-[1.5px] w-full bg-foreground transition-all duration-300", mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : "")} />
                </div>
              </button>

              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-12 right-0 w-48 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-2 flex flex-col gap-1 z-50"
                  >
                    {pathname !== "/login" && (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[11px] uppercase tracking-widest font-medium p-3 hover:bg-foreground/5 rounded-lg transition-colors text-center"
                      >
                        Log In
                      </Link>
                    )}
                    {pathname !== "/register" && (
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[11px] uppercase tracking-widest font-medium p-3 bg-foreground text-background hover:bg-foreground/80 rounded-lg transition-colors text-center"
                      >
                        Register
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

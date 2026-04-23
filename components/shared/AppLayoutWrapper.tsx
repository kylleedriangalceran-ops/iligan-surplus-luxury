"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { FloatingChatWidget } from "@/components/shared/FloatingChatWidget";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  } | null;
}

export function AppLayoutWrapper({ children, user }: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/";
  const isMapPage = pathname === "/map";
  const shouldShowSidebar = user && !isAuthPage && !isMapPage;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowSidebar || typeof window === "undefined") return;

    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    
    // Set initial without triggering synchronous effect lint error
    const timer = setTimeout(handleResize, 0);
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [shouldShowSidebar]);

  return (
    <>
      {/* Navbar — always visible */}
      {!isMapPage && (
        <Navbar
          user={user}
          onHamburgerToggle={() => setSidebarOpen((prev) => !prev)}
          hamburgerOpen={sidebarOpen}
        />
      )}

      <div className={cn("min-h-full flex", shouldShowSidebar ? "w-full" : "flex-col")}>
        {shouldShowSidebar && (
          <Sidebar
            user={user}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          <main className={cn("flex-1 w-full flex flex-col", !isMapPage && "pt-20")}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(5px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
          {user && user.role !== "ADMIN" && !isMapPage && <FloatingChatWidget />}
        </div>
      </div>
    </>
  );
}

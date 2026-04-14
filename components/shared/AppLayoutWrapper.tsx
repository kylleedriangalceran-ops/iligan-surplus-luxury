"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
    if (!shouldShowSidebar) return;
    if (typeof window === "undefined") return;
    setSidebarOpen(window.innerWidth >= 768);
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
            {children}
          </main>
          {user && user.role !== "ADMIN" && !isMapPage && <FloatingChatWidget />}
        </div>
      </div>
    </>
  );
}

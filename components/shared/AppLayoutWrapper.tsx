"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/shared/ToastProvider";
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
  const shouldShowSidebar = user && !isAuthPage;

  return (
    <div className={cn("min-h-full flex", shouldShowSidebar ? "w-full" : "flex-col")}>
      {shouldShowSidebar && <Sidebar user={user} />}
      <div className="flex-1 w-full min-w-0 flex flex-col">
        <ToastProvider>
          {children}
          <FloatingChatWidget />
        </ToastProvider>
      </div>
    </div>
  );
}

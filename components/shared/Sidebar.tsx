"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: {
    name: string;
    role: "MERCHANT" | "CUSTOMER" | "ADMIN";
  };
  isOpen: boolean;
  onClose: () => void;
}

/* ── Icons ── */
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const links: { href: string; label: string; icon: React.ReactNode }[] = [];

  if (user.role === "ADMIN") {
    links.push(
      { href: "/admin", label: "Admin", icon: <ShieldIcon /> },
      { href: "/feed", label: "Curated Drops", icon: <SearchIcon /> }
    );
  } else if (user.role === "MERCHANT") {
    links.push(
      { href: "/dashboard", label: "Dashboard", icon: <SearchIcon /> },
      { href: "/dashboard/inventory", label: "Inventory", icon: <GridIcon /> },
      { href: "/dashboard/reservations", label: "Orders", icon: <ClipboardIcon /> }
    );
  } else {
    links.push(
      { href: "/feed", label: "Curated Drops", icon: <SearchIcon /> },
      { href: "/reservations", label: "My Reserves", icon: <BookmarkIcon /> }
    );
  }

  // City Map link for non-admin
  if (user.role !== "ADMIN") {
    links.push({ href: "/map", label: "City Map", icon: <MapPinIcon /> });
  }

  const activeHref = links
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  // Note on props:
  // Mobile uses isOpen/onClose for a slide-out drawer style.
  // Desktop uses isOpen to represent "isCollapsed" state (true means expanded, false means collapsed to icon only).

  return (
    <>
      {/* Backdrop — mobile only, visible when sidebar is open */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#1C1C1E]/20 backdrop-blur-[2px] transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Single Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-[#FAF9F6]/98 backdrop-blur-xl border-r border-[#1C1C1E]/10 flex flex-col pt-24 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          // Base desktop behavior: 
          "md:sticky md:translate-x-0 overflow-hidden",
          // Width toggling for desktop:
          isOpen ? "w-72 px-4 md:w-72 lg:px-4" : "w-72 px-4 md:w-[84px] md:px-4",
          // Mobile translation:
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          "md:pt-28"
        )}
      >
        <div className={cn("mb-6 transition-opacity duration-300", isOpen ? "opacity-100 px-4" : "md:opacity-0")}>
          <p className="text-[12px] text-[#1C1C1E]/40 font-semibold mb-2 whitespace-nowrap">Navigation</p>
        </div>

        <nav className="flex flex-col gap-1 w-full">
          {links.map((link) => {
            const isActive = activeHref === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (window.innerWidth < 768) onClose(); // Only close on click in mobile
                }}
                title={link.label}
                className={cn(
                  "group relative flex items-center p-2 text-[14px] transition-all duration-300 rounded-[8px] w-full overflow-hidden",
                  isActive
                    ? "text-[#1C1C1E] bg-[#1C1C1E]/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] font-semibold"
                    : "text-[#1C1C1E]/60 font-medium hover:text-[#1C1C1E] hover:bg-[#1C1C1E]/[0.03]"
                )}
              >
                <div className="w-9 h-9 flex items-center justify-center shrink-0">
                  <div className={cn(
                    "relative flex items-center justify-center transition-colors",
                    isActive ? "text-[#1C1C1E]" : "text-[#1C1C1E]/45 group-hover:text-[#1C1C1E]/75"
                  )}>
                    {link.icon}
                  </div>
                </div>
                
                {/* Label text */}
                <span className={cn(
                  "ml-3 whitespace-nowrap transition-all duration-300",
                  isOpen ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0 absolute left-14 invisible",
                  isActive ? "font-semibold text-[#1C1C1E]" : "font-medium"
                )}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </nav>


      </aside>
    </>
  );
}

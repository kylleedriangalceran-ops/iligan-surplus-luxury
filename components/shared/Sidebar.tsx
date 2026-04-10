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
}

/* ── Distinct icons for each nav item ── */
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      href: user.role === "MERCHANT" || user.role === "ADMIN" ? "/dashboard" : "/feed",
      label: "Curated Drops",
      icon: <SearchIcon />,
    },
    {
      href: "/reservations",
      label: "My Reserves",
      icon: <BookmarkIcon />,
    },
  ];

  if (user.role === "MERCHANT" || user.role === "ADMIN") {
    links.push({
      href: "/dashboard/reservations",
      label: "Orders",
      icon: <ClipboardIcon />,
    });
  }

  if (user.role === "ADMIN") {
    links.push({
      href: "/admin",
      label: "Admin",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    });
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-[#1C1C1E]/10 bg-[#FAF9F6]/80 backdrop-blur-xl h-screen pt-28 px-6 shrink-0 sticky top-0">
      <div className="mb-10 px-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#1C1C1E]/40 font-semibold mb-2">Navigation</p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-4 py-3 text-xs uppercase tracking-widest font-medium transition-all duration-300",
                isActive 
                  ? "text-[#1C1C1E]" 
                  : "text-[#1C1C1E]/60 hover:text-[#1C1C1E]"
              )}
            >
              <span className={cn("flex items-center justify-center transition-colors", isActive ? "text-[#1C1C1E]" : "text-[#1C1C1E]/40 group-hover:text-[#1C1C1E]/70")}>
                {link.icon}
              </span>
              <span className="relative top-px leading-none">{link.label}</span>
              
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-px bg-[#1C1C1E]" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pb-8 pt-8">
        <div className="px-4 py-4 border border-[#1C1C1E]/10 rounded-xl bg-[#FAF9F6]">
          <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/40 font-semibold mb-1">Signed In As</p>
          <p className="text-xs uppercase tracking-widest text-[#1C1C1E] font-medium truncate">{user.name}</p>
        </div>
      </div>
    </aside>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Breadcrumbs() {
  const pathname = usePathname();
  
  if (pathname === "/" || pathname === "/feed") return null;

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs uppercase tracking-widest text-[#1C1C1E]/40 mb-8 pt-4">
      <Link href="/" className="hover:text-[#1C1C1E] transition-colors">
        Home
      </Link>
      
      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        
        return (
          <React.Fragment key={url}>
            <span className="text-[#1C1C1E]/20">/</span>
            {isLast ? (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[#1C1C1E] font-medium"
              >
                {segment.replace("-", " ")}
              </motion.span>
            ) : (
              <Link href={url} className="hover:text-[#1C1C1E] transition-colors">
                {segment.replace("-", " ")}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

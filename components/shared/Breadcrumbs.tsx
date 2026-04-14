import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={cn("flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest font-semibold text-[#1C1C1E]/40", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-[#1C1C1E] transition-colors cursor-pointer">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? "text-[#D4AF37]" : "")}>
                {item.label}
              </span>
            )}
            
            {!isLast && <span className="mx-1.5 opacity-50">/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

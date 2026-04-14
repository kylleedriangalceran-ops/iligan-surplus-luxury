"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

export function AnimatedButton({
  children,
  variant = "primary",
  className,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = "relative overflow-hidden flex items-center justify-center font-medium tracking-wide transition-colors duration-500 ease-out py-3 px-8 text-sm uppercase rounded-md";
  
  const variants = {
    primary: "bg-foreground text-background border border-foreground hover:text-background",
    secondary: "bg-secondary text-secondary-foreground border border-transparent hover:border-foreground/10",
    outline: "bg-transparent text-foreground border border-border hover:border-foreground",
  };

  return (
    <motion.button
      className={cn(baseStyles, variants[variant], className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === "outline" && (
        <motion.div
          className="absolute inset-0 bg-foreground/5 z-0"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 bg-white/10 z-0"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}

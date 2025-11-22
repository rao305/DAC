"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps {
  tooltip?: string;
  children: React.ReactNode;
  variant?: "ghost" | "ghost-danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  tooltip,
  children,
  variant = "ghost",
  onClick,
  disabled = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={tooltip}
      title={tooltip}
      className={cn(
        "h-8 w-8 inline-flex items-center justify-center rounded-full border border-transparent transition",
        "text-slate-400 hover:text-slate-100",
        variant === "ghost" && "hover:bg-[#050b16]",
        variant === "ghost-danger" &&
          "hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
};

"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  onClick?: () => void;
}

export function StatusBadge({ status, size = "md", onClick }: StatusBadgeProps) {
  const isConfirmed = status === "confirmed";

  return (
    <span
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "inline-flex items-center rounded-full font-medium shrink-0",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        isConfirmed
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning",
        onClick && "cursor-pointer hover:opacity-80"
      )}
    >
      {isConfirmed ? "Confirmed" : "Draft"}
    </span>
  );
}

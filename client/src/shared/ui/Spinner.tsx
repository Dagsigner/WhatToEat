"use client";

import { cn } from "@/shared/lib/cn";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--tg-theme-button-color,#3390ec)] border-t-transparent" />
    </div>
  );
}

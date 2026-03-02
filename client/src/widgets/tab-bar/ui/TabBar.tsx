"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, Restaurant01Icon, UserCircleIcon } from "@hugeicons/core-free-icons";

const tabs: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/", label: "Главная", icon: <HugeiconsIcon icon={Home01Icon} size={24} /> },
  { href: "/recipes", label: "Рецепты", icon: <HugeiconsIcon icon={Restaurant01Icon} size={24} /> },
  { href: "/profile", label: "Профиль", icon: <HugeiconsIcon icon={UserCircleIcon} size={24} /> },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/20 bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

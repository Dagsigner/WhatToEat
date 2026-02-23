"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

const tabs = [
  { href: "/", label: "Главная", icon: "🏠" },
  { href: "/recipes", label: "Рецепты", icon: "🍽" },
  { href: "/profile", label: "Профиль", icon: "👤" },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--tg-theme-hint-color,#ddd)]/20 bg-[var(--tg-theme-bg-color,#fff)] pb-[env(safe-area-inset-bottom)]">
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
                  ? "text-[var(--tg-theme-button-color,#3390ec)]"
                  : "text-[var(--tg-theme-hint-color,#999)]"
              )}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

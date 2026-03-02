"use client";

import { useEffect } from "react";

function applyTheme() {
  const colorScheme =
    typeof window !== "undefined" &&
    window.Telegram?.WebApp?.colorScheme;

  if (colorScheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function ThemeSync() {
  useEffect(() => {
    applyTheme();

    const webapp =
      typeof window !== "undefined" ? window.Telegram?.WebApp : null;

    if (webapp?.onEvent) {
      webapp.onEvent("themeChanged", applyTheme);
      return () => webapp.offEvent("themeChanged", applyTheme);
    }
  }, []);

  return null;
}

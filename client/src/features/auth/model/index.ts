"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useAuthStore } from "@/shared/store/auth";
import { useLogin } from "../api";

export function useTelegramAuth() {
  const { token, setToken } = useAuthStore();
  const login = useLogin();
  const webAppRef = useRef<typeof import("@twa-dev/sdk").default | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    import("@twa-dev/sdk").then((mod) => {
      webAppRef.current = mod.default;
      setSdkReady(true);
      try {
        mod.default.ready();
      } catch {
        // Not in Telegram environment
      }

      setDebugInfo(
        mod.default.initData
          ? `initData OK (${mod.default.initData.length} chars)`
          : "initData пуст"
      );
    });
  }, []);

  const authenticate = useCallback(() => {
    const WebApp = webAppRef.current;
    if (!WebApp) {
      setDebugInfo("SDK не загружен");
      return;
    }

    if (!WebApp.initData) {
      setDebugInfo("initData пуст — откройте через Telegram");
      return;
    }

    login.mutate(WebApp.initData, {
      onSuccess: (response) => {
        setToken(response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
      },
    });
  }, [login.mutate, setToken]);

  return {
    isAuthenticated: !!token,
    authenticate,
    isLoading: login.isPending,
    error: login.error,
    sdkReady,
    debugInfo,
  };
}

"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useAuthStore } from "@/shared/store/auth";
import { useLogin } from "../api";

export function useTelegramAuth() {
  const { token, setToken } = useAuthStore();
  const login = useLogin();
  const webAppRef = useRef<typeof import("@twa-dev/sdk").default | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    import("@twa-dev/sdk").then((mod) => {
      webAppRef.current = mod.default;
      setSdkReady(true);
      try {
        mod.default.ready();
      } catch {
        // Not in Telegram environment
      }
    });
  }, []);

  const authenticate = useCallback(() => {
    const WebApp = webAppRef.current;
    if (!WebApp || !WebApp.initData) return;

    login.mutate(WebApp.initData, {
      onSuccess: (response) => {
        setToken(response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
      },
    });
  }, [login.mutate, setToken]);

  // Автовход: как только SDK готов и есть initData — входим автоматически
  useEffect(() => {
    if (sdkReady && !token && webAppRef.current?.initData) {
      authenticate();
    }
  }, [sdkReady, token, authenticate]);

  return {
    isAuthenticated: !!token,
    authenticate,
    isLoading: login.isPending,
    error: login.error,
    sdkReady,
  };
}

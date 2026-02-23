"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/shared/store/auth";
import { useLogin } from "../api";
import type { TelegramAuthData } from "@/shared/types/auth";

export function useTelegramAuth() {
  const { token, setToken } = useAuthStore();
  const login = useLogin();
  const webAppRef = useRef<typeof import("@twa-dev/sdk").default | null>(null);

  useEffect(() => {
    import("@twa-dev/sdk").then((mod) => {
      webAppRef.current = mod.default;
      try {
        mod.default.ready();
      } catch {
        // Not in Telegram environment
      }
    });
  }, []);

  const authenticate = useCallback(() => {
    const WebApp = webAppRef.current;
    if (!WebApp) return;

    const data = WebApp.initDataUnsafe;
    if (!data?.user?.id || !data?.hash) return;

    const authData: TelegramAuthData = {
      id: data.user.id,
      first_name: data.user.first_name ?? null,
      last_name: data.user.last_name ?? null,
      username: data.user.username ?? null,
      photo_url: data.user.photo_url ?? null,
      auth_date: data.auth_date,
      hash: data.hash,
    };

    login.mutate(authData, {
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
  };
}

"use client";

import { useTelegramAuth } from "../model";
import { useDevLogin } from "../api";
import { useAuthStore } from "@/shared/store/auth";
import { Button } from "@/shared/ui";

export function LoginScreen() {
  const { isLoading, error, authenticate, sdkReady } = useTelegramAuth();
  const devLogin = useDevLogin();
  const setToken = useAuthStore((s) => s.setToken);

  const hasInitData = sdkReady && !!globalThis.window?.Telegram?.WebApp?.initData;
  const showDevLogin = process.env.NODE_ENV === "development" && !hasInitData;

  const handleDevLogin = () => {
    devLogin.mutate(undefined, {
      onSuccess: (response) => {
        setToken(response.access_token);
        localStorage.setItem("refresh_token", response.refresh_token);
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Что поесть?</h1>
      {error ? (
        <>
          <p className="text-sm text-destructive">
            Ошибка входа. Попробуйте ещё раз.
          </p>
          <Button
            onClick={authenticate}
            disabled={isLoading}
            size="lg"
            className="rounded-xl px-8"
          >
            {isLoading ? "Вход..." : "Повторить"}
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">Входим...</p>
      )}
      {showDevLogin && (
        <Button
          onClick={handleDevLogin}
          disabled={devLogin.isPending}
          variant="secondary"
          size="lg"
          className="rounded-xl px-8"
        >
          {devLogin.isPending ? "Вход..." : "Войти (dev)"}
        </Button>
      )}
      {devLogin.error && (
        <p className="text-sm text-destructive">
          Dev login ошибка: {devLogin.error.message}
        </p>
      )}
    </div>
  );
}

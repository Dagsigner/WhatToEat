"use client";

import { useTelegramAuth } from "../model";

export function LoginScreen() {
  const { isLoading, error, authenticate } = useTelegramAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Что поесть?</h1>
      {error ? (
        <>
          <p className="text-sm text-red-500">
            Ошибка входа. Попробуйте ещё раз.
          </p>
          <button
            onClick={authenticate}
            disabled={isLoading}
            className="rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] px-8 py-3 font-medium text-[var(--tg-theme-button-text-color,#fff)] disabled:opacity-50"
          >
            {isLoading ? "Вход..." : "Повторить"}
          </button>
        </>
      ) : (
        <p className="text-[var(--tg-theme-hint-color,#999)]">Входим...</p>
      )}
    </div>
  );
}

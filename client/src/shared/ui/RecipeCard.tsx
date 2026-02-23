"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { formatMinutes, formatDifficulty } from "@/shared/lib/format";
import { getImageUrl } from "@/shared/lib/image-url";
import type { RecipeListItem } from "@/shared/types/recipe";

interface RecipeCardProps {
  recipe: RecipeListItem;
  variant?: "horizontal" | "vertical";
  onFavoriteToggle?: (id: string, current: boolean) => void;
}

export function RecipeCard({
  recipe,
  variant = "vertical",
  onFavoriteToggle,
}: RecipeCardProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;

  if (variant === "horizontal") {
    return (
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex-shrink-0 w-40 overflow-hidden rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)]"
      >
        <div className="relative h-28 w-full">
          <img
            src={getImageUrl(recipe.photo_url)}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle(recipe.id, recipe.is_favorited);
              }}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-sm"
            >
              {recipe.is_favorited ? "❤️" : "🤍"}
            </button>
          )}
        </div>
        <div className="p-2">
          <p className="line-clamp-2 text-sm font-medium text-[var(--tg-theme-text-color,#333)]">
            {recipe.title}
          </p>
          <p className="mt-1 text-xs text-[var(--tg-theme-hint-color,#999)]">
            {formatMinutes(totalTime)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex gap-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] p-3"
    >
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
        <img
          src={getImageUrl(recipe.photo_url)}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <p className="line-clamp-2 text-sm font-medium text-[var(--tg-theme-text-color,#333)]">
            {recipe.title}
          </p>
          <p className="mt-1 text-xs text-[var(--tg-theme-hint-color,#999)]">
            {formatMinutes(totalTime)} · {formatDifficulty(recipe.difficulty)}
          </p>
        </div>
        {onFavoriteToggle && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle(recipe.id, recipe.is_favorited);
              }}
              className="text-lg"
            >
              {recipe.is_favorited ? "❤️" : "🤍"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

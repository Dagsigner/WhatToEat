"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { formatMinutes, formatDifficulty } from "@/shared/lib/format";
import { getImageUrl } from "@/shared/lib/image-url";
import type { RecipeListItem } from "@/shared/types/recipe";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";

interface RecipeCardProps {
  recipe: RecipeListItem;
  variant?: "horizontal" | "vertical";
  onFavoriteToggle?: (id: string, current: boolean) => void;
  onCookToday?: (id: string) => void;
  cookedToday?: boolean;
}

export function RecipeCard({
  recipe,
  variant = "vertical",
  onFavoriteToggle,
  onCookToday,
  cookedToday = false,
}: RecipeCardProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;

  if (variant === "horizontal") {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded-xl bg-background">
        <Link href={`/recipes/${recipe.id}`} className="flex-1">
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
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/30"
              >
                <HugeiconsIcon icon={FavouriteIcon} size={16} color={recipe.is_favorited ? "#ef4444" : "currentColor"} />
              </button>
            )}
          </div>
          <div className="p-2">
            <p className="line-clamp-2 text-sm font-medium text-foreground">
              {recipe.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMinutes(totalTime)}
            </p>
          </div>
        </Link>
        {onCookToday && (
          <button
            type="button"
            onClick={() => !cookedToday && onCookToday(recipe.id)}
            disabled={cookedToday}
            className={cn(
              "mx-2 mb-2 rounded-lg px-3 py-2 text-sm font-semibold",
              cookedToday
                ? "bg-secondary/50 text-muted-foreground"
                : "bg-secondary text-foreground",
            )}
          >
            Готовлю сегодня
          </button>
        )}
      </div>
    );
  }

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex gap-3 rounded-xl bg-secondary p-3"
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
          <p className="line-clamp-2 text-sm font-medium text-foreground">
            {recipe.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
            >
              <HugeiconsIcon icon={FavouriteIcon} size={20} color={recipe.is_favorited ? "#ef4444" : "currentColor"} />
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

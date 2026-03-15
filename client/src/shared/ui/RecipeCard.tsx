"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { formatMinutes, formatDifficulty } from "@/shared/lib/format";
import { getImageUrl } from "@/shared/lib/image-url";
import type { RecipeListItem } from "@/shared/types/recipe";
import { HugeiconsIcon } from "@hugeicons/react";
import { FavouriteIcon } from "@hugeicons/core-free-icons";

function HeartSolid({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9999 3.94228C13.1757 2.85872 14.7069 2.25 16.3053 2.25C18.0313 2.25 19.679 2.95977 20.8854 4.21074C22.0832 5.45181 22.75 7.1248 22.75 8.86222C22.75 10.5997 22.0831 12.2728 20.8854 13.5137C20.089 14.3393 19.2938 15.1836 18.4945 16.0323C16.871 17.7562 15.2301 19.4985 13.5256 21.14L13.5216 21.1438C12.6426 21.9779 11.2505 21.9476 10.409 21.0754L3.11399 13.5136C0.62867 10.9374 0.62867 6.78707 3.11399 4.21085C5.54605 1.68984 9.46239 1.60032 11.9999 3.94228Z" fill={color} />
    </svg>
  );
}

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
                {recipe.is_favorited
  ? <HeartSolid size={16} color="#ef4444" />
  : <HugeiconsIcon icon={FavouriteIcon} size={16} />}
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
              {recipe.is_favorited
  ? <HeartSolid size={20} color="#ef4444" />
  : <HugeiconsIcon icon={FavouriteIcon} size={20} />}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

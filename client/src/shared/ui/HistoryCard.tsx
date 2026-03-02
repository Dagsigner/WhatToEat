"use client";

import Link from "next/link";
import { getImageUrl } from "@/shared/lib/image-url";
import { formatRelativeDay } from "@/shared/lib/format";
import type { CookingHistoryItem } from "@/shared/types/recipe";

interface HistoryCardProps {
  item: CookingHistoryItem;
}

export function HistoryCard({ item }: HistoryCardProps) {
  return (
    <Link
      href={`/recipes/${item.recipe.id}`}
      className="flex-shrink-0 w-[123px]"
    >
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">
          {formatRelativeDay(item.cooked_at)}
        </p>
      </div>
      <div className="px-3">
        <div className="h-14 w-full overflow-hidden rounded-lg">
          <img
            src={getImageUrl(item.recipe.photo_url)}
            alt={item.recipe.title}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {item.recipe.title}
        </p>
      </div>
    </Link>
  );
}

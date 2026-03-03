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
      className="flex-shrink-0 w-[123px] flex flex-col rounded-xl bg-secondary pt-2 px-3 pb-3"
    >
      <p className="text-lg font-semibold leading-7 text-card-foreground truncate">
        {formatRelativeDay(item.cooked_at)}
      </p>
      <div className="mt-3.5 h-14 w-full overflow-hidden rounded-lg border border-border">
        <img
          src={getImageUrl(item.recipe.photo_url)}
          alt={item.recipe.title}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="mt-1 text-xs font-semibold leading-4 text-muted-foreground truncate">
        {item.recipe.title}
      </p>
    </Link>
  );
}

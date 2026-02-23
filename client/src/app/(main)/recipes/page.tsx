"use client";

import { useState, useMemo } from "react";
import { useRecipes, useToggleFavorite } from "@/features/recipes";
import { useCategories } from "@/features/categories";
import { RecipeCard, Spinner, EmptyState } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useDebounce } from "@/shared/lib/use-debounce";

type Tab = "all" | "favorites";

export default function RecipesPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const params = useMemo(
    () => ({
      limit: 20,
      search: debouncedSearch || undefined,
      category_id: selectedCategory ?? undefined,
      ...(tab === "favorites" ? { is_favorited: true } : {}),
    }),
    [debouncedSearch, selectedCategory, tab],
  );

  const { data, isLoading } = useRecipes(params);
  const { data: categories } = useCategories();
  const toggleFav = useToggleFavorite();

  const handleFavorite = (id: string, current: boolean) => {
    toggleFav.mutate({ id, isFavorited: current });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Вкладки */}
      <div className="flex gap-2">
        {(["all", "favorites"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "bg-[var(--tg-theme-button-color,#3390ec)] text-[var(--tg-theme-button-text-color,#fff)]"
                : "bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] text-[var(--tg-theme-hint-color,#999)]",
            )}
          >
            {t === "all" ? "Все" : "Избранное"}
          </button>
        ))}
      </div>

      {/* Поиск */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск рецептов…"
        className="w-full rounded-xl border border-[var(--tg-theme-hint-color,#ddd)]/30 bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] px-4 py-2.5 text-sm text-[var(--tg-theme-text-color,#333)] outline-none placeholder:text-[var(--tg-theme-hint-color,#999)] focus:border-[var(--tg-theme-button-color,#3390ec)]"
      />

      {/* Категории */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              selectedCategory === null
                ? "bg-[var(--tg-theme-button-color,#3390ec)] text-[var(--tg-theme-button-text-color,#fff)]"
                : "bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] text-[var(--tg-theme-hint-color,#999)]",
            )}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                selectedCategory === cat.id
                  ? "bg-[var(--tg-theme-button-color,#3390ec)] text-[var(--tg-theme-button-text-color,#fff)]"
                  : "bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] text-[var(--tg-theme-hint-color,#999)]",
              )}
            >
              {cat.title}
            </button>
          ))}
        </div>
      )}

      {/* Список */}
      {isLoading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState
          icon={tab === "favorites" ? "💔" : "🔍"}
          title={tab === "favorites" ? "Нет избранных рецептов" : "Ничего не найдено"}
          description={
            tab === "favorites"
              ? "Добавляйте рецепты в избранное"
              : "Попробуйте другой запрос"
          }
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              variant="vertical"
              onFavoriteToggle={handleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

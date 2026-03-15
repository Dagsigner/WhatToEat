"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useInfiniteRecipes, useToggleFavorite } from "@/features/recipes";
import { useCategories } from "@/features/categories";
import { RecipeCard, Spinner, EmptyState, Input, Tabs, TabsList, TabsTrigger, ToggleGroup, ToggleGroupItem } from "@/shared/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { HeartbreakIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { useDebounce } from "@/shared/lib/use-debounce";

type Tab = "all" | "favorites";

export default function RecipesPage() {
  const [tab, setTab] = useState<Tab>("favorites");
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

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteRecipes(params);
  const { data: categories } = useCategories();
  const toggleFav = useToggleFavorite();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasNextPage) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, fetchNextPage],
  );

  const recipes = data?.pages.flatMap((p) => p.items) ?? [];

  const handleFavorite = (id: string, current: boolean) => {
    toggleFav.mutate({ id, isFavorited: current });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Segmented control */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full !h-10">
          <TabsTrigger value="favorites" className="flex-1">Избранное</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">Все</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Поиск */}
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск рецептов…"
        className="rounded-xl bg-secondary"
      />

      {/* Категории */}
      {categories && categories.length > 0 && (
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <ToggleGroup
            type="single"
            value={selectedCategory ?? ""}
            onValueChange={(v) => setSelectedCategory(v || null)}
            spacing={2}
            className="flex w-max"
          >
            <ToggleGroupItem value="" className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background">Все</ToggleGroupItem>
            {categories.map((cat) => (
              <ToggleGroupItem key={cat.id} value={cat.id} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background">
                {cat.title}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Список */}
      {isLoading ? (
        <Spinner />
      ) : !recipes.length ? (
        <EmptyState
          icon={<HugeiconsIcon icon={tab === "favorites" ? HeartbreakIcon : Search01Icon} size={36} />}
          title={tab === "favorites" ? "Нет избранных рецептов" : "Ничего не найдено"}
          description={
            tab === "favorites"
              ? "Добавляйте рецепты в избранное"
              : "Попробуйте другой запрос"
          }
        />
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              variant="vertical"
              onFavoriteToggle={handleFavorite}
            />
          ))}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && <Spinner />}
        </div>
      )}
    </div>
  );
}

"use client";

import { useHistoryRecipes, useRecipes, useToggleFavorite } from "@/features/recipes";
import { RecipeCard, Spinner, EmptyState } from "@/shared/ui";

export default function HomePage() {
  const { data: history, isLoading: historyLoading } = useHistoryRecipes(10);
  const { data: suggestions, isLoading: suggestionsLoading } = useRecipes({ limit: 4 });
  const toggleFav = useToggleFavorite();

  const handleFavorite = (id: string, current: boolean) => {
    toggleFav.mutate({ id, isFavorited: current });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Недавно приготовлено */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--tg-theme-text-color,#333)]">
          Недавно приготовлено
        </h2>
        {historyLoading ? (
          <Spinner />
        ) : !history?.items.length ? (
          <EmptyState
            icon="🍳"
            title="Пока ничего"
            description="Отмечайте рецепты как приготовленные"
          />
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {history.items.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                variant="horizontal"
                onFavoriteToggle={handleFavorite}
              />
            ))}
          </div>
        )}
      </section>

      {/* Что приготовить сегодня? */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--tg-theme-text-color,#333)]">
          Что приготовить сегодня?
        </h2>
        {suggestionsLoading ? (
          <Spinner />
        ) : !suggestions?.items.length ? (
          <EmptyState
            icon="📖"
            title="Рецептов пока нет"
            description="Скоро здесь появятся рецепты"
          />
        ) : (
          <div className="space-y-3">
            {suggestions.items.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                variant="vertical"
                onFavoriteToggle={handleFavorite}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

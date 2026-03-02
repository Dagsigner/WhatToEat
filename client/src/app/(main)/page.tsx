"use client";

import { useState } from "react";
import { useCookingHistory, useRecipes, useToggleFavorite } from "@/features/recipes";
import { RecipeCard, HistoryCard, Spinner, EmptyState, Button } from "@/shared/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pot01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";

export default function HomePage() {
  const { data: history, isLoading: historyLoading } = useCookingHistory();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: suggestions, isLoading: suggestionsLoading } = useRecipes({
    is_in_history: false,
    limit: 4,
  });
  const toggleFav = useToggleFavorite();

  const handleFavorite = (id: string, current: boolean) => {
    toggleFav.mutate({ id, isFavorited: current });
  };

  return (
    <div className="space-y-6 p-4">
      {/* История готовки */}
      <section>
        <h2 className="text-2xl font-bold text-foreground">
          История готовки
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Отображается, что вы готовили
        </p>
        <div className="mt-3">
          {historyLoading ? (
            <Spinner />
          ) : !history?.length ? (
            <EmptyState
              icon={<HugeiconsIcon icon={Pot01Icon} size={36} />}
              title="Пока ничего"
              description="Отмечайте рецепты как приготовленные"
            />
          ) : (
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {history.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Что поесть сегодня? — остров */}
      <section className="rounded-2xl bg-secondary p-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Что поесть сегодня?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Подберем подходящие блюда
          </p>
        </div>

        {!showSuggestions ? (
          <Button
            onClick={() => setShowSuggestions(true)}
            className="mt-6 w-full rounded-xl py-6 text-base"
            size="lg"
          >
            Подобрать
          </Button>
        ) : suggestionsLoading ? (
          <Spinner className="mt-6" />
        ) : !suggestions?.items.length ? (
          <div className="mt-6">
            <EmptyState
              icon={<HugeiconsIcon icon={BookOpen01Icon} size={36} />}
              title="Рецептов пока нет"
              description="Скоро здесь появятся рецепты"
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {suggestions.items.map((recipe) => (
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
    </div>
  );
}

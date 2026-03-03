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
        <p className="mt-1 text-base font-semibold leading-6 text-muted-foreground">
          Отображается, что вы готовили
        </p>
        <div className="mt-4">
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
      <section className="flex flex-col gap-28 rounded-3xl bg-secondary p-2.5">
        <div className="text-center">
          <h2 className="text-2xl font-bold leading-8 text-card-foreground">
            Что поесть сегодня?
          </h2>
          <p className="mt-1 text-base font-semibold leading-6 text-muted-foreground">
            Подберем подходящие блюда
          </p>
        </div>

        {!showSuggestions ? (
          <button
            onClick={() => setShowSuggestions(true)}
            className="flex w-full flex-col items-center rounded-2xl bg-primary px-4 py-3"
          >
            <span className="text-base font-semibold leading-6 text-primary-foreground">
              Получить список блюд
            </span>
            <span className="text-base font-semibold leading-6 text-primary-foreground/80">
              Подберем на основе истории
            </span>
          </button>
        ) : suggestionsLoading ? (
          <Spinner />
        ) : !suggestions?.items.length ? (
          <div>
            <EmptyState
              icon={<HugeiconsIcon icon={BookOpen01Icon} size={36} />}
              title="Рецептов пока нет"
              description="Скоро здесь появятся рецепты"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
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

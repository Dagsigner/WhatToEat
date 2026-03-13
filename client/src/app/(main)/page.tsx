"use client";

import { useEffect, useRef, useState } from "react";
import { useAddToHistory, useCookingHistory, useRecipes, useToggleFavorite } from "@/features/recipes";
import { toast } from "sonner";
import axios from "axios";
import { RecipeCard, HistoryCard, Spinner, EmptyState, Button } from "@/shared/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Pot01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";

export default function HomePage() {
  const { data: history, isLoading: historyLoading } = useCookingHistory();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: suggestions, isLoading: suggestionsLoading } = useRecipes({
    is_in_history: false,
    is_favorited: true,
    random: true,
    limit: 4,
  });
  const toggleFav = useToggleFavorite();
  const addHistory = useAddToHistory();
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history?.length && historyRef.current) {
      historyRef.current.scrollLeft = historyRef.current.scrollWidth;
    }
  }, [history]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const cookedTodayIds = new Set(
    history
      ?.filter((item) => item.cooked_at.slice(0, 10) === todayStr)
      .map((item) => item.recipe.id) ?? [],
  );

  const handleFavorite = (id: string, current: boolean) => {
    toggleFav.mutate({ id, isFavorited: current });
  };

  const handleCookToday = (id: string) => {
    addHistory.mutate(id, {
      onSuccess: () => {
        toast.success("Рецепт добавлен в историю!");
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          toast.error("Вы уже отметили блюдо сегодня");
        } else {
          toast.error("Не удалось сохранить");
        }
      },
    });
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
            <div ref={historyRef} className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {history.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Что поесть сегодня? — остров */}
      <section className="flex flex-col gap-8 rounded-3xl bg-secondary p-2.5">
        <div className="text-center">
          <h2 className="text-2xl font-bold leading-8 text-card-foreground">
            Что поесть сегодня?
          </h2>
          <p className="mt-1 text-base font-semibold leading-6 text-muted-foreground">
            Подберем подходящие блюда на основе вашей истории готовки
          </p>
        </div>

        {!showSuggestions ? (
          <button
            onClick={() => setShowSuggestions(true)}
            className="flex h-16 w-full flex-col items-center justify-center rounded-2xl bg-primary px-4"
          >
            <span className="text-base font-semibold leading-6 text-primary-foreground">
              Получить список блюд
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
                onCookToday={handleCookToday}
                cookedToday={cookedTodayIds.has(recipe.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

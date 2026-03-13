"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import {
  useCookingHistory,
  useRecipeDetail,
  useToggleFavorite,
  useAddToHistory,
} from "@/features/recipes";
import { Spinner, Button } from "@/shared/ui";
import { formatMinutes, formatDifficulty } from "@/shared/lib/format";
import { getImageUrl } from "@/shared/lib/image-url";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: recipe, isLoading, isError, refetch } = useRecipeDetail(id);
  const toggleFav = useToggleFavorite();
  const addHistory = useAddToHistory();
  const { data: history } = useCookingHistory();

  const todayStr = new Date().toISOString().slice(0, 10);
  const cookedToday = history?.some(
    (item) => item.recipe.id === id && item.cooked_at.slice(0, 10) === todayStr,
  ) ?? false;

  if (isLoading) {
    return <Spinner className="pt-20" />;
  }

  if (isError || !recipe) {
    return (
      <div className="flex flex-col items-center gap-4 pt-20">
        <p className="text-sm text-muted-foreground">
          Не удалось загрузить рецепт
        </p>
        <Button
          onClick={() => refetch()}
          className="rounded-xl px-6"
        >
          Попробовать снова
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground"
        >
          Назад
        </button>
      </div>
    );
  }

  const totalTime = recipe.prep_time + recipe.cook_time;
  const hasNutrition = recipe.protein != null || recipe.fat != null || recipe.carbs != null;

  return (
    <div className="pb-24">
      {/* Фото */}
      <div className="relative h-64 w-full">
        <img
          src={getImageUrl(recipe.photo_url)}
          alt={recipe.title}
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
        >
          ←
        </button>
      </div>

      <div className="space-y-5 p-4">
        {/* Заголовок */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {recipe.title}
          </h1>
          {recipe.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Мета */}
        <div className="flex gap-4 text-sm">
          <MetaBadge label="Время" value={formatMinutes(totalTime)} />
          <MetaBadge label="Сложность" value={formatDifficulty(recipe.difficulty)} />
          <MetaBadge label="Порции" value={recipe.servings} />
        </div>

        {/* КБЖУ */}
        {hasNutrition && (
          <div className="rounded-xl bg-secondary p-3">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Пищевая ценность
            </p>
            <div className="flex justify-around text-center">
              {recipe.protein != null && (
                <NutritionItem label="Белки" value={`${recipe.protein} г`} />
              )}
              {recipe.fat != null && (
                <NutritionItem label="Жиры" value={`${recipe.fat} г`} />
              )}
              {recipe.carbs != null && (
                <NutritionItem label="Углеводы" value={`${recipe.carbs} г`} />
              )}
            </div>
          </div>
        )}

        {/* Категории */}
        {recipe.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.categories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
              >
                {cat.title}
              </span>
            ))}
          </div>
        )}

        {/* Ингредиенты */}
        {recipe.recipe_ingredients.length > 0 && (
          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Ингредиенты
            </h2>
            <ul className="space-y-2">
              {recipe.recipe_ingredients.map((ri) => (
                <li
                  key={ri.id}
                  className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-sm"
                >
                  <span className="text-foreground">
                    {ri.ingredient?.title ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    {ri.amount} {ri.ingredient?.unit_of_measurement ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Шаги */}
        {recipe.steps.length > 0 && (
          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Приготовление
            </h2>
            <ol className="space-y-4">
              {recipe.steps
                .sort((a, b) => a.step_number - b.step_number)
                .map((step) => (
                  <li key={step.id}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {step.step_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {step.title}
                        </p>
                        {step.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        )}
                        {step.photo_url && (
                          <img
                            src={getImageUrl(step.photo_url)}
                            alt={`Шаг ${step.step_number}`}
                            className="mt-2 w-full rounded-lg object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        )}
      </div>

      {/* Кнопки внизу */}
      <div className="fixed bottom-16 left-0 right-0 flex gap-3 border-t border-border/20 bg-background p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          onClick={() => toggleFav.mutate({ id: recipe.id, isFavorited: recipe.is_favorited })}
          disabled={toggleFav.isPending}
          className="flex-1 rounded-xl border-primary text-primary"
          size="lg"
        >
          {recipe.is_favorited ? "Убрать из избранного" : "В избранное"}
        </Button>
        <Button
          onClick={() =>
            addHistory.mutate(recipe.id, {
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
            })
          }
          disabled={addHistory.isPending || cookedToday}
          className="flex-1 rounded-xl"
          size="lg"
        >
          Готовлю сегодня
        </Button>
      </div>
    </div>
  );
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function NutritionItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

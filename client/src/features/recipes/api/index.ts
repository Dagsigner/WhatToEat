"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchRecipes,
  fetchRecipeDetail,
  addFavorite,
  removeFavorite,
  addToHistory,
  type FetchRecipesParams,
} from "@/shared/api/recipes";

export const recipeKeys = {
  all: ["recipes"] as const,
  lists: () => [...recipeKeys.all, "list"] as const,
  list: (params: FetchRecipesParams) =>
    [...recipeKeys.lists(), params] as const,
  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
};

export function useRecipes(params: FetchRecipesParams = {}) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => fetchRecipes(params),
  });
}

export function useRecipeDetail(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipeDetail(id),
    enabled: !!id,
  });
}

export function useHistoryRecipes(limit = 10) {
  return useRecipes({ is_in_history: true, limit });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isFavorited,
    }: {
      id: string;
      isFavorited: boolean;
    }) => (isFavorited ? removeFavorite(id) : addFavorite(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
    },
  });
}

export function useAddToHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addToHistory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
    },
  });
}

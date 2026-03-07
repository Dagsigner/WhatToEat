"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchRecipes,
  fetchRecipeDetail,
  addFavorite,
  removeFavorite,
  addToHistory,
  fetchCookingHistory,
  type FetchRecipesParams,
} from "@/shared/api/recipes";

export const recipeKeys = {
  all: ["recipes"] as const,
  lists: () => [...recipeKeys.all, "list"] as const,
  list: (params: FetchRecipesParams) =>
    [...recipeKeys.lists(), params] as const,
  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  cookingHistory: () => [...recipeKeys.all, "cooking-history"] as const,
};

export function useRecipes(params: FetchRecipesParams = {}) {
  return useQuery({
    queryKey: recipeKeys.list(params),
    queryFn: () => fetchRecipes(params),
  });
}

export function useInfiniteRecipes(params: Omit<FetchRecipesParams, "offset"> = {}) {
  const limit = params.limit ?? 20;
  return useInfiniteQuery({
    queryKey: [...recipeKeys.lists(), "infinite", params] as const,
    queryFn: ({ pageParam = 0 }) => fetchRecipes({ ...params, limit, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.limit;
      return next < lastPage.total ? next : undefined;
    },
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

export function useCookingHistory() {
  return useQuery({
    queryKey: recipeKeys.cookingHistory(),
    queryFn: fetchCookingHistory,
  });
}

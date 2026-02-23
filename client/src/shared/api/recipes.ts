import { api } from "./client";
import type { PaginatedResponse } from "@/shared/types/pagination";
import type {
  RecipeListItem,
  RecipeDetail,
  FavoriteToggleResponse,
  HistoryToggleResponse,
} from "@/shared/types/recipe";

export interface FetchRecipesParams {
  limit?: number;
  offset?: number;
  category_id?: string;
  search?: string;
  is_in_history?: boolean;
  is_favorited?: boolean;
}

export async function fetchRecipes(
  params: FetchRecipesParams = {},
): Promise<PaginatedResponse<RecipeListItem>> {
  const { data } = await api.get<PaginatedResponse<RecipeListItem>>(
    "/recipes",
    { params },
  );
  return data;
}

export async function fetchRecipeDetail(id: string): Promise<RecipeDetail> {
  const { data } = await api.get<RecipeDetail>(`/recipes/${id}`);
  return data;
}

export async function addFavorite(id: string): Promise<FavoriteToggleResponse> {
  const { data } = await api.post<FavoriteToggleResponse>(
    `/recipes/${id}/favorite`,
  );
  return data;
}

export async function removeFavorite(
  id: string,
): Promise<FavoriteToggleResponse> {
  const { data } = await api.delete<FavoriteToggleResponse>(
    `/recipes/${id}/favorite`,
  );
  return data;
}

export async function addToHistory(id: string): Promise<HistoryToggleResponse> {
  const { data } = await api.post<HistoryToggleResponse>(
    `/recipes/${id}/history`,
  );
  return data;
}

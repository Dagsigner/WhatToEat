import apiClient from "./client";
import type {
  FeaturedSyncResponse,
  FeaturedToggleResponse,
  PaginatedResponse,
  RecipeAdmin,
  RecipeCreate,
  RecipeDeleteResponse,
  RecipeDetail,
  RecipeUpdate,
} from "@/types";

export async function listRecipes(
  limit = 20,
  offset = 0,
  search?: string,
  sort_by?: string,
  category_id?: string,
): Promise<PaginatedResponse<RecipeAdmin>> {
  const params: Record<string, unknown> = { limit, offset };
  if (search) params.search = search;
  if (sort_by) params.sort_by = sort_by;
  if (category_id) params.category_id = category_id;
  const res = await apiClient.get<PaginatedResponse<RecipeAdmin>>("/recipes/admin", { params });
  return res.data;
}

export async function getRecipe(id: string): Promise<RecipeDetail> {
  const res = await apiClient.get<RecipeDetail>(`/recipes/${id}/admin`);
  return res.data;
}

export async function createRecipe(data: RecipeCreate): Promise<RecipeDetail> {
  const res = await apiClient.post<RecipeDetail>("/recipes/admin", data);
  return res.data;
}

export async function updateRecipe(id: string, data: RecipeUpdate): Promise<RecipeDetail> {
  const res = await apiClient.patch<RecipeDetail>(`/recipes/${id}/admin`, data);
  return res.data;
}

export async function deleteRecipe(id: string): Promise<RecipeDeleteResponse> {
  const res = await apiClient.delete<RecipeDeleteResponse>(`/recipes/${id}/admin`);
  return res.data;
}

export async function toggleFeatured(id: string): Promise<FeaturedToggleResponse> {
  const res = await apiClient.patch<FeaturedToggleResponse>(`/recipes/${id}/admin/featured`);
  return res.data;
}

export async function syncFeatured(): Promise<FeaturedSyncResponse> {
  const res = await apiClient.post<FeaturedSyncResponse>("/recipes/admin/sync-featured");
  return res.data;
}

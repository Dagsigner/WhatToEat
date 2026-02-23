import apiClient from "./client";
import type {
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
): Promise<PaginatedResponse<RecipeAdmin>> {
  const params: Record<string, unknown> = { limit, offset };
  if (search) params.search = search;
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

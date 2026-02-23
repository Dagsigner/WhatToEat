import apiClient from "./client";
import type {
  IngredientAdmin,
  IngredientCreate,
  IngredientDeleteResponse,
  IngredientUpdate,
  PaginatedResponse,
} from "@/types";

export async function listIngredients(
  limit = 20,
  offset = 0,
  search?: string,
): Promise<PaginatedResponse<IngredientAdmin>> {
  const params: Record<string, unknown> = { limit, offset };
  if (search) params.search = search;
  const res = await apiClient.get<PaginatedResponse<IngredientAdmin>>("/ingredients/admin", { params });
  return res.data;
}

export async function getIngredient(id: string): Promise<IngredientAdmin> {
  const res = await apiClient.get<IngredientAdmin>(`/ingredients/${id}/admin`);
  return res.data;
}

export async function createIngredient(data: IngredientCreate): Promise<IngredientAdmin> {
  const res = await apiClient.post<IngredientAdmin>("/ingredients/admin", data);
  return res.data;
}

export async function updateIngredient(id: string, data: IngredientUpdate): Promise<IngredientAdmin> {
  const res = await apiClient.patch<IngredientAdmin>(`/ingredients/${id}/admin`, data);
  return res.data;
}

export async function deleteIngredient(id: string): Promise<IngredientDeleteResponse> {
  const res = await apiClient.delete<IngredientDeleteResponse>(`/ingredients/${id}/admin`);
  return res.data;
}

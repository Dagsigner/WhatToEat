import apiClient from "./client";
import type {
  CategoryAdmin,
  CategoryCreate,
  CategoryDeleteResponse,
  CategoryUpdate,
  PaginatedResponse,
} from "@/types";

export async function listCategories(
  limit = 20,
  offset = 0,
  search?: string,
): Promise<PaginatedResponse<CategoryAdmin>> {
  const params: Record<string, unknown> = { limit, offset };
  if (search) params.search = search;
  const res = await apiClient.get<PaginatedResponse<CategoryAdmin>>("/categories/admin", { params });
  return res.data;
}

export async function getCategory(id: string): Promise<CategoryAdmin> {
  const res = await apiClient.get<CategoryAdmin>(`/categories/${id}/admin`);
  return res.data;
}

export async function createCategory(data: CategoryCreate): Promise<CategoryAdmin> {
  const res = await apiClient.post<CategoryAdmin>("/categories/admin", data);
  return res.data;
}

export async function updateCategory(id: string, data: CategoryUpdate): Promise<CategoryAdmin> {
  const res = await apiClient.patch<CategoryAdmin>(`/categories/${id}/admin`, data);
  return res.data;
}

export async function deleteCategory(id: string): Promise<CategoryDeleteResponse> {
  const res = await apiClient.delete<CategoryDeleteResponse>(`/categories/${id}/admin`);
  return res.data;
}

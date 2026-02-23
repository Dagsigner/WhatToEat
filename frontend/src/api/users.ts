import apiClient from "./client";
import type { PaginatedResponse, UserAdmin, UserDeleteResponse } from "@/types";

export async function listUsers(
  limit = 20,
  offset = 0,
  search?: string,
): Promise<PaginatedResponse<UserAdmin>> {
  const params: Record<string, unknown> = { limit, offset };
  if (search) params.search = search;
  const res = await apiClient.get<PaginatedResponse<UserAdmin>>("/users/admin", { params });
  return res.data;
}

export async function getUser(id: string): Promise<UserAdmin> {
  const res = await apiClient.get<UserAdmin>(`/users/${id}/admin`);
  return res.data;
}

export async function deleteUser(id: string): Promise<UserDeleteResponse> {
  const res = await apiClient.delete<UserDeleteResponse>(`/users/${id}/admin`);
  return res.data;
}

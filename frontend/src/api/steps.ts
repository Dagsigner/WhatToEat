import apiClient from "./client";
import type {
  PaginatedResponse,
  StepAdmin,
  StepCreate,
  StepDeleteResponse,
  StepUpdate,
} from "@/types";

export async function listSteps(
  limit = 20,
  offset = 0,
  recipeId?: string,
): Promise<PaginatedResponse<StepAdmin>> {
  const params: Record<string, unknown> = { limit, offset };
  if (recipeId) params.recipe_id = recipeId;
  const res = await apiClient.get<PaginatedResponse<StepAdmin>>("/steps/admin", { params });
  return res.data;
}

export async function getStep(id: string): Promise<StepAdmin> {
  const res = await apiClient.get<StepAdmin>(`/steps/${id}/admin`);
  return res.data;
}

export async function createStep(data: StepCreate): Promise<StepAdmin> {
  const res = await apiClient.post<StepAdmin>("/steps/admin", data);
  return res.data;
}

export async function updateStep(id: string, data: StepUpdate): Promise<StepAdmin> {
  const res = await apiClient.patch<StepAdmin>(`/steps/${id}/admin`, data);
  return res.data;
}

export async function deleteStep(id: string): Promise<StepDeleteResponse> {
  const res = await apiClient.delete<StepDeleteResponse>(`/steps/${id}/admin`);
  return res.data;
}

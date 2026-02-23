import apiClient from "./client";
import type { ImageItem, ImageUploadResponse, PaginatedResponse } from "@/types";

export async function listImages(
  limit = 20,
  offset = 0,
): Promise<PaginatedResponse<ImageItem>> {
  const res = await apiClient.get<PaginatedResponse<ImageItem>>("/images", {
    params: { limit, offset },
  });
  return res.data;
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient.delete(`/images/${id}`);
}

export async function uploadFile(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ImageUploadResponse>("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

import { api } from "./client";
import type { CategoryItem } from "@/shared/types/category";

export async function fetchCategories(
  query?: string,
): Promise<CategoryItem[]> {
  const { data } = await api.get<CategoryItem[]>("/categories", {
    params: query ? { query } : undefined,
  });
  return data;
}

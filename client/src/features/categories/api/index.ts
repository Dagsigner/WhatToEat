"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/shared/api/categories";

export function useCategories(query?: string) {
  return useQuery({
    queryKey: ["categories", query ?? ""],
    queryFn: () => fetchCategories(query),
  });
}

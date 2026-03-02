import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { LoginResponse } from "@/shared/types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: async (initData: string) => {
      const response = await api.post<LoginResponse>("/auth/login/webapp", {
        init_data: initData,
      });
      return response.data;
    },
  });
}

export function useDevLogin() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<LoginResponse>("/auth/login/dev");
      return response.data;
    },
  });
}

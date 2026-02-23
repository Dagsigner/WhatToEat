import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { TelegramAuthData, LoginResponse } from "@/shared/types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: async (data: TelegramAuthData) => {
      const response = await api.post<LoginResponse>("/auth/login", data);
      return response.data;
    },
  });
}

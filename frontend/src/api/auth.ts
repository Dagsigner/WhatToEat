import apiClient from "./client";
import type { AdminLoginRequest, AdminLoginResponse, LogoutResponse } from "@/types";

export async function loginAdmin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
  const res = await apiClient.post<AdminLoginResponse>("/auth/login/admin", data);
  return res.data;
}

export async function logoutAdmin(): Promise<LogoutResponse> {
  const res = await apiClient.post<LogoutResponse>("/auth/logout/admin");
  return res.data;
}

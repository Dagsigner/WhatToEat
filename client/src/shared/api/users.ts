import { api } from "./client";
import type { UserProfile, UserUpdateData } from "@/shared/types/user";

export async function fetchProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/users/me");
  return data;
}

export async function updateProfile(
  body: UserUpdateData,
): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>("/users/me", body);
  return data;
}

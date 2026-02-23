"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/store/auth";
import { LoginScreen } from "@/features/auth";

export default function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/");
    }
  }, [token, router]);

  if (token) return null;

  return <LoginScreen />;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth-storage";

export function useAdminSession() {
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/admin");
    }
  }, [router]);

  return {
    hasSession: !!getAccessToken(),
  };
}

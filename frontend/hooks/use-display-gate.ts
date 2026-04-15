"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isDisplayPasscodeVerified } from "@/lib/auth-storage";

export function useDisplayGate() {
  const router = useRouter();

  useEffect(() => {
    if (!isDisplayPasscodeVerified()) {
      router.replace("/gate");
    }
  }, [router]);

  return {
    allowed: isDisplayPasscodeVerified(),
  };
}

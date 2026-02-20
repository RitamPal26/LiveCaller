"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreUser } from "@/hooks/use-store-user";
import { Loader2 } from "lucide-react";

export function AuthenticatedView() {
  const userId = useStoreUser();
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      router.push("/chat");
    }
  }, [userId, router]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm md:text-base text-slate-400">
        Securing your session...
      </p>
    </div>
  );
}
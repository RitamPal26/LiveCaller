"use client";

import { UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";

export function AuthenticatedView() {
  const userId = useStoreUser();

  return (
    <div className="flex flex-col items-center space-y-6 p-4 text-center">
      <UserButton afterSignOutUrl="/" />
      <h2 className="text-2xl md:text-4xl font-bold">You are logged in!</h2>
      
      {userId ? (
        <p className="text-sm md:text-base text-green-400">Database sync complete. Ready to chat!</p>
      ) : (
        <p className="text-sm md:text-base text-slate-400 animate-pulse">Syncing profile to database...</p>
      )}
    </div>
  );
}
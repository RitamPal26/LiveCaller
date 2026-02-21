"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/chat/sidebar";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useRouter, usePathname } from "next/navigation"; // Added usePathname
import { useStoreUser } from "@/hooks/use-store-user";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  useStoreUser();

  const isRootChat = pathname === "/chat";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      <AuthLoading>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-400 animate-pulse">Loading secure chat...</p>
        </div>
      </AuthLoading>

      <Authenticated>
        <Sidebar />
        <main
          className={`flex-1 flex-col bg-slate-950 ${isRootChat ? "hidden md:flex" : "flex"}`}
        >
          {children}
        </main>
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <p className="text-slate-400">You are logged out.</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white"
          >
            Return to Login
          </button>
        </div>
      </Unauthenticated>
    </div>
  );
}

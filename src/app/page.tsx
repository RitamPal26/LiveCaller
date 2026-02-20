"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { AuthenticatedView } from "@/components/auth/authenticated-view";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-4">
      <Unauthenticated>
        <div className="flex flex-col items-center space-y-6 text-center max-w-lg">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Welcome to <span className="text-blue-500">LiveChat</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400">
            Sign in to start messaging your friends in real-time.
          </p>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold transition-colors hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
        </div>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedView />
      </Authenticated>
    </main>
  );
}

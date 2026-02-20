"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
      {/* Shown only when logged out */}
      <Unauthenticated>
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Welcome to <span className="text-blue-500">LiveChat</span>
          </h1>
          <p className="text-slate-400">Sign in to start messaging</p>
          <SignInButton mode="modal">
            <button className="rounded-md bg-blue-600 px-6 py-3 font-semibold transition-colors hover:bg-blue-700">
              Sign In
            </button>
          </SignInButton>
        </div>
      </Unauthenticated>

      {/* Shown only when logged in */}
      <Authenticated>
        <div className="flex flex-col items-center space-y-4">
          <UserButton afterSignOutUrl="/" />
          <h2 className="text-2xl font-bold">You are logged in!</h2>
          <p className="text-slate-400">Database sync coming next...</p>
        </div>
      </Authenticated>
    </main>
  );
}
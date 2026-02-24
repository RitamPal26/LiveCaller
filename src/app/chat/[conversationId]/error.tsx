"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Chat Boundary Error:", error);
  }, [error]);

  const isForbidden = error.message.includes("Forbidden");

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 shadow-sm">
        {isForbidden ? (
          <ShieldAlert className="h-8 w-8 text-red-500" />
        ) : (
          <AlertCircle className="h-8 w-8 text-amber-500" />
        )}
      </div>

      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
        {isForbidden ? "Access Denied" : "Something went wrong"}
      </h2>

      <p className="mb-8 max-w-md text-sm text-slate-400 leading-relaxed">
        {isForbidden
          ? "You don't have permission to view this conversation. It may be private or you may have been removed."
          : "We encountered an unexpected error while trying to load this chat. Please try again."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
        <Button
          onClick={() => router.push("/chat")}
          className="bg-white text-slate-950 hover:bg-slate-200 w-full sm:w-auto"
        >
          Return to Chats
        </Button>

        {!isForbidden && (
          <Button
            variant="outline"
            onClick={() => reset()}
            className="border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white w-full sm:w-auto"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

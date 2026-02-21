"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { AlertCircle } from "lucide-react";

export function ChatInput({
  conversationId,
  scrollToBottom,
}: {
  conversationId: Id<"conversations">;
  scrollToBottom: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.typing.set);
  const lastPingRef = useRef(0);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setNewMessage(text);
    if (error) setError(null);

    if (text === "") {
      setTyping({ conversationId, isTyping: false }).catch(console.error);
      return;
    }

    const now = Date.now();
    if (now - lastPingRef.current > 1500) {
      lastPingRef.current = now;
      setTyping({ conversationId, isTyping: true }).catch(console.error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || trimmed.length > 1000) return;

    setIsPending(true);
    setError(null);

    try {
      await sendMessage({ conversationId, content: trimmed });
      setNewMessage(""); // Only clear input if successful
      scrollToBottom();
      setTyping({ conversationId, isTyping: false }).catch(console.error);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Message failed to send. Check your connection.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="border-t border-slate-800 p-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 mb-2 px-2 animate-in slide-in-from-bottom-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button
            onClick={() => handleSendMessage()}
            className="underline font-semibold hover:text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          maxLength={1000}
          disabled={isPending}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-800 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isPending}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}

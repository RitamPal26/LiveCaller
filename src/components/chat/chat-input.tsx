"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export function ChatInput({
  conversationId,
  scrollToBottom,
}: {
  conversationId: Id<"conversations">;
  scrollToBottom: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.typing.set);
  const lastPingRef = useRef(0);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setNewMessage(text);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || trimmed.length > 1000) return;

    try {
      await sendMessage({ conversationId, content: trimmed });
      setNewMessage("");
      scrollToBottom();
      setTyping({ conversationId, isTyping: false }).catch(console.error);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="border-t border-slate-800 p-4">
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          maxLength={1000}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-800"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { ChevronDown } from "lucide-react";

function formatTime(creationTime: number) {
  const date = new Date(creationTime);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ChatArea({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const messages = useQuery(api.messages.list, { conversationId });
  const sendMessage = useMutation(api.messages.send);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;

    setIsAtBottom(atBottom);
    if (atBottom) setShowNewMessageButton(false);
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
    setShowNewMessageButton(false);
  };

  useEffect(() => {
    if (messages) {
      if (isAtBottom) {
        scrollToBottom();
      } else {
        setShowNewMessageButton(true);
      }
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [conversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage({ conversationId, content: newMessage.trim() });
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 relative">
      <div className="flex h-16 items-center border-b border-slate-800 px-4">
        <h2 className="text-lg font-bold text-white">Chat</h2>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages === undefined ? (
          <p className="text-center text-slate-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-400">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.clerkId === user?.id;
            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <span className="text-xs text-slate-400 mb-1 ml-1">
                    {msg.sender?.name || "Unknown"}
                  </span>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-white shadow-sm ${isMe ? "bg-blue-600 rounded-br-none" : "bg-slate-800 rounded-bl-none"}`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 mx-1">
                  {formatTime(msg._creationTime)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showNewMessageButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-lg border border-slate-700 transition-all hover:bg-slate-700"
        >
          <ChevronDown className="h-4 w-4" />
          New messages
        </button>
      )}

      <div className="border-t border-slate-800 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  );
}

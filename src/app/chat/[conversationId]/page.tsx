"use client";

import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

// Helper function to format timestamps dynamically
function formatTime(creationTime: number) {
  const date = new Date(creationTime);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (isThisYear) {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId as Id<"conversations">;
  const { user } = useUser(); // Get the currently logged-in Clerk user

  const [newMessage, setNewMessage] = useState("");

  const messages = useQuery(api.messages.list, { conversationId });
  const sendMessage = useMutation(api.messages.send);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        conversationId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex h-16 items-center border-b border-slate-800 px-4">
        <h2 className="text-lg font-bold text-white">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages === undefined ? (
          <p className="text-center text-slate-400">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-400">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            // Check if this message was sent by the current user
            const isMe = msg.sender?.clerkId === user?.id;

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Only show the sender's name if it's NOT you */}
                {!isMe && (
                  <span className="text-xs text-slate-400 mb-1 ml-1">
                    {msg.sender?.name || "Unknown"}
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 text-white shadow-sm ${
                    isMe
                      ? "bg-blue-600 rounded-br-none" // Your messages: Blue, flat bottom-right
                      : "bg-slate-800 rounded-bl-none" // Their messages: Gray, flat bottom-left
                  }`}
                >
                  {msg.content}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-slate-500 mt-1 mx-1">
                  {formatTime(msg._creationTime)}
                </span>
              </div>
            );
          })
        )}
      </div>

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

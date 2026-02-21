"use client";

import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Trash2 } from "lucide-react";
import { Id } from "@convex/_generated/dataModel";

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

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

interface MessageProps {
  _id: Id<"messages">;
  _creationTime: number;
  content: string;
  isDeleted?: boolean;
  sender?: { clerkId?: string; name?: string } | null;
  reactions?: Array<{ emoji: string; userId: string }>;
}

export function MessageBubble({
  msg,
  isMe,
  currentUserId,
}: {
  msg: MessageProps;
  isMe: boolean;
  currentUserId?: string;
}) {
  const deleteMessage = useMutation(api.messages.softDelete);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const reactionCounts: Record<string, number> = {};
  const myReactions = new Set<string>();

  msg.reactions?.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
    if (r.userId === currentUserId) myReactions.add(r.emoji);
  });

  return (
    <div
      className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} mb-4`}
    >
      {!isMe && (
        <span className="text-xs text-slate-400 mb-1 ml-1">
          {msg.sender?.name || "Unknown"}
        </span>
      )}

      <div
        className={`flex items-center group max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
      >
        {!msg.isDeleted && (
          <div
            className={`hidden group-hover:flex items-center gap-1 shrink-0 ${isMe ? "ml-2" : "mr-2"}`}
          >
            <div className="flex bg-slate-800 rounded-full border border-slate-700 shadow-sm px-1">
              {ALLOWED_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                  className="p-1.5 hover:bg-slate-700 rounded-full transition-colors text-sm"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {isMe && (
              <button
                onClick={() => deleteMessage({ messageId: msg._id })}
                className="p-2 text-slate-500 hover:text-red-500 transition-colors bg-slate-800 rounded-full border border-slate-700"
                title="Delete Message"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div
          className={`flex flex-col relative ${isMe ? "items-end" : "items-start"}`}
        >
          <div
            className={`rounded-lg px-4 py-2 break-words whitespace-pre-wrap ${
              msg.isDeleted
                ? "bg-transparent border border-slate-700 text-slate-500 italic"
                : isMe
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-200"
            }`}
          >
            {msg.isDeleted ? "This message was deleted" : msg.content}
          </div>

          {!msg.isDeleted && Object.keys(reactionCounts).length > 0 && (
            <div
              className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction({ messageId: msg._id, emoji })}
                  className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border ${
                    myReactions.has(emoji)
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <span className="text-[10px] text-slate-500 mt-1 mx-1">
        {formatTime(msg._creationTime)}
      </span>
    </div>
  );
}

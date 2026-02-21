"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Trash2, SmilePlus } from "lucide-react";

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
  const router = useRouter();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const messages = useQuery(api.messages.list, { conversationId });
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.readReceipts.markRead);

  const activeTypists = useQuery(api.typing.getActive, { conversationId });
  const setTyping = useMutation(api.typing.set);

  const lastPingRef = useRef(0);

  const deleteMessage = useMutation(api.messages.softDelete);

  const toggleReaction = useMutation(api.messages.toggleReaction);
  const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;

    setIsAtBottom(atBottom);
    if (atBottom) setShowNewMessageButton(false);
  };

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
      await sendMessage({ conversationId, content: newMessage.trim() });
      setNewMessage("");
      scrollToBottom();

      setTyping({ conversationId, isTyping: false }).catch(console.error);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
    setShowNewMessageButton(false);
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else {
      setTimeout(() => setShowNewMessageButton(true), 0);
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [messages, conversationId, markRead]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      markRead({ conversationId }).catch(console.error);
    }
  }, [messages, conversationId, markRead]);

  return (
    <div className="flex h-full flex-col bg-slate-950 relative">
      <div className="flex h-16 items-center border-b border-slate-800 px-4 gap-3">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden rounded-full p-2 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

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

            const reactionCounts: Record<string, number> = {};
            const myReactions = new Set<string>();

            msg.reactions?.forEach((r) => {
              reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
              if (r.userId === user?.id) myReactions.add(r.emoji);
            });

            return (
              <div
                key={msg._id}
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
                            onClick={() =>
                              toggleReaction({ messageId: msg._id, emoji })
                            }
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

                  <div className="flex flex-col relative">
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

                    {!msg.isDeleted &&
                      Object.keys(reactionCounts).length > 0 && (
                        <div
                          className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {Object.entries(reactionCounts).map(
                            ([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() =>
                                  toggleReaction({ messageId: msg._id, emoji })
                                }
                                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border ${
                                  myReactions.has(emoji)
                                    ? "bg-blue-500/20 border-blue-500/50 text-blue-200"
                                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                  </div>
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

      {activeTypists && activeTypists.length > 0 && (
        <div className="px-4 py-2 flex items-center text-sm text-slate-400">
          <span className="italic mr-2">
            {activeTypists.join(", ")}{" "}
            {activeTypists.length === 1 ? "is" : "are"} typing
          </span>
          <div className="flex space-x-1 items-center mb-1">
            <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}

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
    </div>
  );
}

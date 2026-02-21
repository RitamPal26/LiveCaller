"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Trash2 } from "lucide-react";

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

            return (
              <div
                key={msg._id}
                className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} mb-4`}
              >
                {/* 1. Sender Name (for other people) */}
                {!isMe && (
                  <span className="text-xs text-slate-400 mb-1 ml-1">
                    {msg.sender?.name || "Unknown"}
                  </span>
                )}

                {/* 2. Message Bubble & Delete Button Container */}
                {/* FIX: Changed to a flex row so the button sits naturally beside the bubble inside the hover group */}
                <div className="flex items-center group max-w-[70%]">
                  {/* The Delete Button (Now sits to the left of the message) */}
                  {isMe && !msg.isDeleted && (
                    <button
                      onClick={() => deleteMessage({ messageId: msg._id })}
                      className="hidden group-hover:flex items-center justify-center p-2 mr-1 text-slate-500 hover:text-red-500 transition-colors shrink-0"
                      title="Delete Message"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                  {/* The Message Bubble */}
                  <div
                    className={`rounded-lg px-4 py-2 break-words whitespace-pre-wrap ${
                      msg.isDeleted
                        ? "bg-transparent border border-slate-700 text-slate-500 italic" // Deleted style
                        : isMe
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-200" // Normal style
                    }`}
                  >
                    {msg.isDeleted ? "This message was deleted" : msg.content}
                  </div>
                </div>

                {/* 3. Timestamp */}
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

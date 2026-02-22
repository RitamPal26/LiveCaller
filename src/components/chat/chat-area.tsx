"use client";

import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Users } from "lucide-react";

import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { UserAvatar } from "./user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatArea({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const { user } = useUser();
  const router = useRouter();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const messages = useQuery(api.messages.list, { conversationId });

  const currentConversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });

  const isAiThinking =
    currentConversation?.isGroup &&
    messages &&
    messages.length > 0 &&
    messages[messages.length - 1].content.includes("@AI") &&
    messages[messages.length - 1].sender?.clerkId !== "system_ai";

  const activeTypists = useQuery(api.typing.getActive, { conversationId });
  const markRead = useMutation(api.readReceipts.markRead);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAtBottom) scrollToBottom();
    else setTimeout(() => setShowNewMessageButton(true), 0);
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100);
      markRead({ conversationId }).catch(console.error);
    }
  }, [messages, conversationId, markRead]);

  return (
    <div className="flex h-full flex-col bg-slate-950 relative">
      <div className="flex h-16 items-center border-b border-slate-800 px-4 gap-3 shadow-sm z-10 shrink-0">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden rounded-full p-2 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {currentConversation === undefined ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : currentConversation === null ? (
          <h2 className="text-lg font-bold text-white">Chat not found</h2>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden">
            {currentConversation.isGroup ? (
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white shrink-0 border border-slate-600">
                <Users className="h-5 w-5 text-slate-300" />
              </div>
            ) : (
              <UserAvatar
                imageUrl={currentConversation.otherUser?.imageUrl}
                name={currentConversation.otherUser?.name}
                size="sm"
              />
            )}

            <div className="flex flex-col min-w-0">
              <h2 className="text-base font-bold text-white leading-tight truncate">
                {currentConversation.isGroup
                  ? currentConversation.groupName
                  : currentConversation.otherUser?.name || "Unknown User"}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {currentConversation.isGroup
                  ? currentConversation.participantNames
                  : currentConversation.otherUser?.email}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages === undefined ? (
          <div className="flex flex-col space-y-4 mt-auto">
            <div className="flex w-full justify-start">
              <Skeleton className="h-10 w-[40%] rounded-lg" />
            </div>
            <div className="flex w-full justify-end">
              <Skeleton className="h-16 w-[60%] rounded-lg" />
            </div>
            <div className="flex w-full justify-start">
              <Skeleton className="h-10 w-[50%] rounded-lg" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-white-600 dark:text-sky-400">
            No messages yet. Say Hi!!
          </p>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isMe={msg.sender?.clerkId === user?.id}
                currentUserId={user?.id}
              />
            ))}

            {isAiThinking && <TypingIndicator activeTypists={["AI Agent"]} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showNewMessageButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-lg border border-slate-700 transition-all hover:bg-slate-700"
        >
          <ChevronDown className="h-4 w-4" /> New messages
        </button>
      )}

      <TypingIndicator activeTypists={activeTypists || []} />

      <ChatInput
        conversationId={conversationId}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}

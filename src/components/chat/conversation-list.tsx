"use client";

import { useRouter } from "next/navigation";
import { UserAvatar } from "./user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProps {
  _id: string;
  name?: string;
  imageUrl?: string;
  lastSeen?: number;
  isOnline?: boolean;
}

interface ConversationProps {
  _id: string;
  unreadCount: number;
  isGroup?: boolean;
  groupName?: string;
  otherUser?: UserProps;
  lastMessage?: {
    _id: string;
    _creationTime: number;
    content: string;
    senderId: string;
  };
}

function formatPreviewTime(time: number) {
  const date = new Date(time);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationList({
  conversations,
  checkIsOnline,
}: {
  conversations: ConversationProps[] | undefined;
  checkIsOnline: (user: UserProps | null | undefined) => boolean;
}) {
  const router = useRouter();

  if (conversations === undefined) {
    return (
      <div className="space-y-1 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3 rounded-lg p-2">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center mt-4">
        No active chats. Search for a user above!
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const otherUser = conv.otherUser;
        const lastMessage = conv.lastMessage;

        const displayName = conv.isGroup
          ? conv.groupName
          : otherUser?.name || "Unknown User";
        const displayImage = conv.isGroup ? undefined : otherUser?.imageUrl;
        const isOnline = conv.isGroup ? false : checkIsOnline(otherUser);

        return (
          <div
            key={conv._id}
            className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-slate-800 cursor-pointer"
            onClick={() => router.push(`/chat/${conv._id}`)}
          >
            <UserAvatar
              imageUrl={displayImage}
              name={displayName}
              isOnline={isOnline}
            />

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex justify-between items-baseline mb-0.5">
                <p className="text-sm font-medium text-white truncate">
                  {displayName}
                </p>
                {lastMessage && (
                  <p className="text-xs text-slate-500 whitespace-nowrap ml-2">
                    {formatPreviewTime(lastMessage._creationTime)}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400 truncate pr-2">
                  {lastMessage ? (
                    <>
                      {lastMessage.senderId !== otherUser?._id && (
                        <span className="text-slate-500 mr-1">You:</span>
                      )}
                      {lastMessage.content}
                    </>
                  ) : (
                    <span className="italic">No messages yet</span>
                  )}
                </p>

                {conv.unreadCount > 0 && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

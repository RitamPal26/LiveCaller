"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@convex/_generated/api";
import { useDebounce } from "@/hooks/use-debounce";
import { UserButton, useUser } from "@clerk/nextjs";

function formatPreviewTime(time: number) {
  const date = new Date(time);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchedUsers = useQuery(api.users.getUsers, {
    searchTerm: debouncedSearchTerm,
  });
  const activeConversations = useQuery(api.conversations.listActive);
  const createOrGetConversation = useMutation(api.conversations.createOrGet);

  const isRootChat = pathname === "/chat";

  const handleStartChat = async (userId: any) => {
    try {
      const conversationId = await createOrGetConversation({
        participantId: userId,
      });
      setSearchTerm("");
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const isSearching = debouncedSearchTerm.length > 0;

  return (
    <aside
      className={`flex-col border-r border-slate-800 bg-slate-900 h-full ${
        isRootChat ? "flex w-full md:w-80" : "hidden md:flex md:w-80"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <h2 className="text-lg font-bold tracking-tight text-white">
          Messages
        </h2>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="p-4 border-b border-slate-800">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isSearching && (
          <>
            <p className="text-xs font-semibold text-slate-500 px-2 py-1 uppercase tracking-wider">
              Global Users
            </p>
            {searchedUsers?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center mt-4">
                No users found.
              </p>
            ) : (
              searchedUsers?.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-slate-800 cursor-pointer"
                  onClick={() => handleStartChat(u._id)}
                >
                  {u.imageUrl ? (
                    <img
                      src={u.imageUrl}
                      alt="User"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
                      {u.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  {u.isOnline && (
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  )}
                </div>
              ))
            )}
          </>
        )}

        {!isSearching && (
          <>
            {activeConversations === undefined ? (
              <p className="text-sm text-slate-400 text-center mt-4 animate-pulse">
                Loading chats...
              </p>
            ) : activeConversations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center mt-4">
                No active chats. Search for a user above!
              </p>
            ) : (
              activeConversations.map((conv) => {
                const otherUser = conv.otherUser;
                const lastMessage = conv.lastMessage;
                const isMe =
                  lastMessage?.senderId &&
                  clerkUser &&
                  activeConversations.find(
                    (c) => c.otherUser?._id !== lastMessage.senderId,
                  );

                return (
                  <div
                    key={conv._id}
                    className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-slate-800 cursor-pointer"
                    onClick={() => router.push(`/chat/${conv._id}`)}
                  >
                    <div className="relative">
                      {otherUser?.imageUrl ? (
                        <img
                          src={otherUser.imageUrl}
                          alt="User"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-white text-lg">
                          {otherUser?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      {otherUser?.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-sm font-medium text-white truncate">
                          {otherUser?.name || "Unknown User"}
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
                                <span className="text-slate-500 mr-1">
                                  You:
                                </span>
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
              })
            )}
          </>
        )}
      </div>
    </aside>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@convex/_generated/api";
import { useDebounce } from "@/hooks/use-debounce";
import { UserButton } from "@clerk/nextjs";
import { Id } from "@convex/_generated/dataModel";

import { ConversationList } from "./conversation-list";
import { UserAvatar } from "./user-avatar";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchedUsers = useQuery(api.users.getUsers, {
    searchTerm: debouncedSearchTerm,
  });
  const activeConversations = useQuery(api.conversations.listActive);
  const createOrGetConversation = useMutation(api.conversations.createOrGet);

  const isRootChat = pathname === "/chat";
  const isSearching = debouncedSearchTerm.length > 0;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const checkIsOnline = (
    user: { lastSeen?: number; isOnline?: boolean } | null | undefined,
  ) => {
    if (!user) return false;
    if (user.lastSeen) return now - user.lastSeen < 30000;
    return user.isOnline ?? false;
  };

  const handleStartChat = async (userId: Id<"users">) => {
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

  return (
    <aside
      className={`flex-col border-r border-slate-800 bg-slate-900 h-full ${isRootChat ? "flex w-full md:w-80" : "hidden md:flex md:w-80"}`}
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

      <div className="flex-1 overflow-y-auto p-2">
        {isSearching ? (
          <div className="space-y-1">
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
                  <UserAvatar
                    imageUrl={u.imageUrl}
                    name={u.name}
                    isOnline={checkIsOnline(u)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <ConversationList
            conversations={activeConversations}
            checkIsOnline={checkIsOnline}
          />
        )}
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useDebounce } from "@/hooks/use-debounce";

export function Sidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const users = useQuery(api.users.getUsers, {
    searchTerm: debouncedSearchTerm,
  });

  return (
    <aside className="hidden md:flex w-80 flex-col border-r border-slate-800 bg-slate-900 h-full">
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <h2 className="text-lg font-bold tracking-tight">Messages</h2>
      </div>
      
      <div className="p-4 border-b border-slate-800">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {users === undefined ? (
          <p className="text-sm text-slate-400 text-center mt-4">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-400 text-center mt-4">No users found.</p>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-slate-800 cursor-pointer"
              onClick={() => console.log("Clicked to chat with:", user.name)}
            >
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.name || "User"} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                  {user.name?.charAt(0) || "U"}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name || "Unknown User"}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              
              {user.isOnline && (
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
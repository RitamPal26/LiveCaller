"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useDebounce } from "@/hooks/use-debounce";
import { X, Check, Users } from "lucide-react";
import { UserAvatar } from "./user-avatar";

export function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: Id<"conversations">) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<Id<"users">>>(
    new Set(),
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchedUsers = useQuery(api.users.getUsers, {
    searchTerm: debouncedSearchTerm,
  });
  const createGroup = useMutation(api.conversations.createGroup);

  const toggleUser = (userId: Id<"users">) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) newSelected.delete(userId);
    else newSelected.add(userId);
    setSelectedUsers(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.size < 2) return;
    try {
      const convId = await createGroup({
        name: groupName.trim(),
        participantIds: Array.from(selectedUsers),
      });
      onCreated(convId);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" /> Create Group
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Engineering Team"
              className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
              Add Members
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-md bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />

            <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-800 rounded-md p-1 bg-slate-950/50">
              {searchedUsers?.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u._id)}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar imageUrl={u.imageUrl} name={u.name} size="sm" />
                    <span className="text-sm font-medium text-white">
                      {u.name}
                    </span>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center ${selectedUsers.has(u._id) ? "bg-blue-500 border-blue-500" : "border-slate-600"}`}
                  >
                    {selectedUsers.has(u._id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              ))}
              {searchedUsers?.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">
                  No users found
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.size < 2}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Group ({selectedUsers.size + 1})
          </button>
        </div>
      </div>
    </div>
  );
}

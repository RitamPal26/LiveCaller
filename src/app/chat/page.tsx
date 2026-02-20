import { UserButton } from "@clerk/nextjs";

export default function ChatDashboard() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center p-4">
      <div className="mb-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to LiveCaller</h1>
      <p className="text-slate-400 max-w-sm">
        Select a conversation from the sidebar to start messaging, or search for a user to start a new chat.
      </p>
    </div>
  );
}
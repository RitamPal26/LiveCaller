import { ReactNode } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">

      <aside className="hidden md:flex w-80 flex-col border-r border-slate-800 bg-slate-900">
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <h2 className="text-lg font-bold tracking-tight">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-slate-400 text-center mt-10">
            User list coming soon...
          </p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-950">
        {children}
      </main>
    </div>
  );
}
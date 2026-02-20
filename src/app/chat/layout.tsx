import { ReactNode } from "react";
import { Sidebar } from "@/components/chat/sidebar";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-slate-950">{children}</main>
    </div>
  );
}

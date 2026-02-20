import { use } from "react";
import { Id } from "@convex/_generated/dataModel";
import { ChatArea } from "@/components/chat/chat-area";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId as Id<"conversations">;

  return <ChatArea conversationId={conversationId} />;
}

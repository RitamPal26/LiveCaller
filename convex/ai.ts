import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const handleCommand = action({
  args: {
    conversationId: v.id("conversations"),
    command: v.string(),
  },
  handler: async (ctx, args) => {
    const chatHistory = await ctx.runQuery(internal.messages.getHistoryForAi, {
      conversationId: args.conversationId,
    });

    const openRouterMessages = chatHistory.map(
      (msg: { content: string; isAi: boolean; senderName?: string }) => ({
        role: msg.isAi ? "assistant" : "user",
        content: `${msg.senderName}: ${msg.content}`,
      }),
    );

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: `You are an AI assistant that lives inside a group chat.

Your job is to:
1. Read ONLY the last 5-6 messages.
2. Understand the context quickly.
3. Either:
   - Summarize the discussion briefly (if conversation is scattered), OR
   - Respond naturally and helpfully (if someone asked a question), OR
   - Add light, friendly engagement (if conversation is casual).

Rules:
- Keep responses short (1-4 sentences max).
- Do NOT dominate the conversation.
- Do NOT respond to every message — only when useful.
- Be friendly, slightly witty, but not cringe.
- Never repeat messages verbatim.
- If users are debating, stay neutral and clarify.
- If someone asks a factual question, answer clearly and concisely.
- If context is unclear, ask one simple clarifying question.
- Avoid long explanations unless directly asked.
- Never mention that you are an AI unless explicitly asked.

Tone:
Casual, smart, and socially aware — like the sharp friend in the group who speaks only when it adds value.

Output format:
Just reply with the message that should be posted in the chat.
No extra commentary.`,
            },
            ...openRouterMessages,
            { role: "user", content: args.command },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error Details:", errorText);
      throw new Error(`OpenRouter API failed with status: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    await ctx.runMutation(internal.messages.sendAiMessage, {
      conversationId: args.conversationId,
      content: reply,
    });
  },
});

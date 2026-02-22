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
              content: `You are a highly efficient AI assistant participating in a group chat. 
            
            Follow these strict rules:
            1. Keep all responses precise, crisp, and strictly under 60 words.
            2. Use simple language and avoid unnecessary jargon.
            3. You will receive the recent chat history. Use it for context, but only answer the final command.
            4. If answering a specific person, address them by their first name.
            
            If you violate the 60-word limit, your system will crash.`,
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

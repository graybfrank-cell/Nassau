/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Shared helper for calling the Anthropic Claude API from marketing agents.
 * Uses the official SDK with server-side web search support.
 */
import Anthropic from "@anthropic-ai/sdk";

interface ClaudeCallOptions {
  system: string;
  messages: any[];
  tools?: any[];
  maxTokens?: number;
}

const client = new Anthropic();

export async function callClaude({
  system,
  messages,
  tools,
  maxTokens = 4096,
}: ClaudeCallOptions): Promise<string> {
  const hasTools = tools && tools.length > 0;

  const params: any = {
    model: "claude-opus-4-6",
    max_tokens: maxTokens,
    system,
    messages: [...messages],
  };

  if (hasTools) {
    params.tools = tools;
  }

  const MAX_ITERATIONS = 10;
  let iteration = 0;
  let currentMessages: any[] = [...messages];

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    const response = await client.messages.create({
      ...params,
      messages: currentMessages,
    });

    console.log(
      `[marketing-claude] Iteration ${iteration} — stop_reason: ${response.stop_reason}, blocks: ${response.content?.length}`
    );

    if (response.stop_reason === "end_turn" || !hasTools) {
      const textBlocks = response.content.filter(
        (b: any): b is any => b.type === "text"
      );
      return textBlocks.map((b: any) => b.text).join("\n") || "";
    }

    // Server-side tool hit iteration limit; re-send to continue
    if (response.stop_reason === "pause_turn") {
      currentMessages = [
        ...messages,
        { role: "assistant", content: response.content },
      ];
      continue;
    }

    const toolUseBlocks = response.content.filter(
      (b: any): b is any => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content.filter(
        (b: any): b is any => b.type === "text"
      );
      return textBlocks.map((b: any) => b.text).join("\n") || "";
    }

    currentMessages.push({ role: "assistant", content: response.content });

    const toolResults: any[] = toolUseBlocks.map(
      (toolUseBlock: any) => ({
        type: "tool_result" as const,
        tool_use_id: toolUseBlock.id,
        content: "Tool not available",
      })
    );

    currentMessages.push({ role: "user", content: toolResults });
  }

  console.error(
    `[marketing-claude] Hit max iterations (${MAX_ITERATIONS}) without end_turn`
  );
  return "";
}

export function extractJSON(text: string): unknown {
  if (!text || text.trim() === "") {
    throw new Error("Empty response from Claude");
  }
  try {
    return JSON.parse(text);
  } catch {}
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {}
  }
  throw new Error("Could not extract JSON from Claude response");
}

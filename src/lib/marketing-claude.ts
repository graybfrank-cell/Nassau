/**
 * Shared helper for calling the Anthropic Claude API from marketing agents.
 */

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeTool {
  type: string;
  name: string;
}

interface ClaudeCallOptions {
  system: string;
  messages: ClaudeMessage[];
  tools?: ClaudeTool[];
  maxTokens?: number;
}

export async function callClaude({
  system,
  messages,
  tools,
  maxTokens = 4096,
}: ClaudeCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: Record<string, any> = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
  }

  console.log(
    `[marketing-claude] Calling Claude API — system prompt: ${system.slice(0, 80)}...`
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[marketing-claude] API error ${response.status}: ${errorText}`);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(
    `[marketing-claude] Response received — stop_reason: ${data.stop_reason}, content blocks: ${data.content?.length}`
  );

  // Extract text from content blocks
  const textBlocks = data.content?.filter(
    (block: { type: string }) => block.type === "text"
  );
  return textBlocks?.map((b: { text: string }) => b.text).join("\n") || "";
}

/**
 * Extract JSON from a Claude response that may contain markdown code blocks.
 */
export function extractJSON(text: string): unknown {
  // Try parsing directly first
  try {
    return JSON.parse(text);
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try finding JSON array or object
    const bracketMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (bracketMatch) {
      return JSON.parse(bracketMatch[1]);
    }
    throw new Error("Could not extract JSON from Claude response");
  }
}

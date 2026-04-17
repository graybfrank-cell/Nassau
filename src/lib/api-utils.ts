import { NextResponse } from "next/server";

export function apiError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : "Internal server error";
  console.error(`[API Error]${context ? ` ${context}:` : ""}`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

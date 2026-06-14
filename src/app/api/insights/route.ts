// EcoPulse — API route for AI-generated insights (optional Groq integration)
// Criterion: Security (HIGH) — validates all input with Zod, never exposes API key to client
// Degrades gracefully if GROQ_API_KEY is absent

import { type NextRequest, NextResponse } from "next/server";
import { InsightRequestSchema } from "@/schemas";
import { generateAiInsight } from "@/lib/groq";

export async function POST(req: NextRequest) {
  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = InsightRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Attempt AI generation — returns null if API key absent or request fails
  const aiInsight = await generateAiInsight(parsed.data);

  if (!aiInsight) {
    return NextResponse.json(
      { insight: null, source: "rule-based", message: "AI unavailable — using rule-based insights" },
      { status: 200 },
    );
  }

  return NextResponse.json({ insight: aiInsight, source: "ai" }, { status: 200 });
}

// Health check — verifies route is reachable without consuming API quota
export async function GET() {
  const hasKey = !!process.env["GROQ_API_KEY"];
  return NextResponse.json({
    status: "ok",
    aiEnabled: hasKey,
    model: hasKey ? "llama3-8b-8192" : null,
  });
}

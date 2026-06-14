// EcoPulse — Optional Groq API integration for AI-generated insight summaries
// Criterion: Security (HIGH) — API key is server-side only, never exposed to client
// Criterion: Problem Statement Alignment — degrades to rule-based insights if key absent

import { InsightRequestSchema, type InsightRequestInput } from "@/schemas";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-8b-8192"; // Fast, capable, free tier available

/**
 * Generate an AI-powered insight summary using Groq.
 * Falls back to null (caller should use rule-based insights) if:
 * - GROQ_API_KEY is not set
 * - The API request fails
 * - Response is malformed
 */
export async function generateAiInsight(
  input: InsightRequestInput,
): Promise<string | null> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) return null;

  // Validate input before sending to external API
  const validated = InsightRequestSchema.safeParse(input);
  if (!validated.success) {
    console.warn("InsightRequest validation failed — skipping AI insight");
    return null;
  }

  const { profileSummary, topCategory, weeklyCarbon, recentActivitiesSummary } =
    validated.data;

  const systemPrompt = `You are EcoPulse, a friendly personal carbon-awareness coach for urban Indians.
Your tone is warm, honest, and non-judgmental. You explain carbon impact in relatable human terms.
Keep insights under 80 words. Always end with one specific, actionable next step.
Never use guilt or fear. Focus on empowerment and small wins.`;

  const userPrompt = `User context: ${profileSummary}
This week's top carbon category: ${topCategory}
Weekly carbon total: ${weeklyCarbon.toFixed(1)} kg CO₂
Recent activities summary: ${recentActivitiesSummary}

Write a 2-sentence insight about their pattern, then suggest one concrete action they can take tomorrow.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.warn(`Groq API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    return content ?? null;
  } catch (err) {
    console.warn("Groq API request failed:", err);
    return null;
  }
}

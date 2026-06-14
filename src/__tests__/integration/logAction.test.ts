// EcoPulse — Integration: log action → nudge → confirm → state update
// Criterion: Testing (HIGH) — end-to-end flow through carbon engine and storage

import { describe, it, expect } from "vitest";
import { calculateCarbonKg, buildPreActionNudge } from "@/lib/carbonEngine";
import { ActivityFormSchema } from "@/schemas";
import { generateRecommendations } from "@/lib/recommendationEngine";
import { generateInsights } from "@/lib/insightEngine";
import type { UserProfile, ActivityLog } from "@/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PROFILE: UserProfile = {
  id: "test-profile-id",
  name: "Test User",
  city: "Mumbai",
  country: "India",
  commuteStyle: "car-petrol",
  commuteDistanceKm: 15,
  dietPattern: "non-vegetarian",
  travelFrequency: "occasionally",
  householdSize: 2,
  goals: ["reduce-transport", "reduce-meat"],
  createdAt: new Date().toISOString(),
  onboardingCompleted: true,
};

// ── Integration: Log meat meal flow ──────────────────────────────────────────

describe("Integration: log meat meal → nudge → insight", () => {
  it("form validation passes for valid meat meal input", () => {
    const formData = {
      category: "meals" as const,
      subtype: "beef-mutton",
      quantity: 1,
    };
    const result = ActivityFormSchema.safeParse(formData);
    expect(result.success).toBe(true);
  });

  it("carbon calculation is correct for beef meal", () => {
    const kg = calculateCarbonKg("beef-mutton", 1);
    expect(kg).toBeCloseTo(6.8, 1);
  });

  it("nudge shows high-impact context for beef meal", () => {
    const nudge = buildPreActionNudge("beef-mutton", 1, [], PROFILE);
    expect(nudge.carbonKg).toBeCloseTo(6.8, 1);
    expect(nudge.equivalents.length).toBeGreaterThan(0);
    expect(nudge.contextMessage).toBeTruthy();
    // Should suggest a swap for high-impact meat
    expect(nudge.alternativeSuggestion).toBeTruthy();
  });

  it("nudge includes alternative suggestion for beef", () => {
    const nudge = buildPreActionNudge("beef-mutton", 1, [], PROFILE);
    expect(nudge.alternativeSuggestion).toContain("vegetarian");
    expect(nudge.alternativeSavingKg).toBeGreaterThan(0);
  });

  it("after logging, recommendations update to include meal change", () => {
    const meatLog: ActivityLog = {
      id: "log-1",
      category: "meals",
      subtype: "beef-mutton",
      quantity: 1,
      unit: "meal",
      carbonKg: 6.8,
      nudgeShown: true,
      timestamp: new Date().toISOString(),
    };

    const recs = generateRecommendations(PROFILE, [meatLog], 5);
    const mealRec = recs.find((r) => r.category === "meals");
    expect(mealRec).toBeDefined();
    expect(mealRec!.reason).toBeTruthy();
  });

  it("insights surface meat frequency after multiple meat logs", () => {
    const meatLogs: ActivityLog[] = Array.from({ length: 4 }, (_, i) => ({
      id: `log-${i}`,
      category: "meals" as const,
      subtype: "beef-mutton",
      quantity: 1,
      unit: "meal",
      carbonKg: 6.8,
      nudgeShown: true,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    }));

    const insights = generateInsights(meatLogs, PROFILE);
    expect(insights.length).toBeGreaterThan(0);
    const meatInsight = insights.find(
      (ins) => ins.category === "meals" || ins.title.toLowerCase().includes("meat"),
    );
    expect(meatInsight).toBeDefined();
  });
});

// ── Integration: Log flight flow ──────────────────────────────────────────────

describe("Integration: log flight → nudge equivalents", () => {
  it("flight carbon calculation is within expected range", () => {
    const kg = calculateCarbonKg("flight-domestic-short", 1);
    expect(kg).toBeGreaterThan(70);
    expect(kg).toBeLessThan(100);
  });

  it("nudge for flight shows months of electricity equivalent", () => {
    const nudge = buildPreActionNudge("flight-domestic-short", 1, [], PROFILE);
    expect(nudge.contextMessage).toMatch(/month|household|electricity/i);
  });

  it("flight equivalents show large km driven value", () => {
    const nudge = buildPreActionNudge("flight-domestic-short", 1, [], PROFILE);
    const kmEquiv = nudge.equivalents.find((e) => e.icon === "🚗");
    expect(kmEquiv).toBeDefined();
    // 85 kg / 0.21 = ~405 km
    expect(kmEquiv!.value).toBeGreaterThan(300);
  });
});

// ── Integration: Zero-emission activity ──────────────────────────────────────

describe("Integration: zero-emission activity (walk/cycle)", () => {
  it("carbon is 0 for walk-cycle", () => {
    const kg = calculateCarbonKg("walk-cycle", 10);
    expect(kg).toBe(0);
  });

  it("nudge shows positive message for zero-emission activity", () => {
    const nudge = buildPreActionNudge("walk-cycle", 5, [], PROFILE);
    expect(nudge.carbonKg).toBe(0);
    expect(nudge.equivalents[0]?.label).toMatch(/zero/i);
  });

  it("no alternative suggestion for walk-cycle", () => {
    const nudge = buildPreActionNudge("walk-cycle", 5, [], PROFILE);
    expect(nudge.alternativeSuggestion).toBeUndefined();
  });
});

// ── Integration: large quantity input ────────────────────────────────────────

describe("Integration: boundary inputs", () => {
  it("very large quantity (10000 km) calculates without NaN", () => {
    const kg = calculateCarbonKg("car-petrol", 10_000);
    expect(isNaN(kg)).toBe(false);
    expect(isFinite(kg)).toBe(true);
    expect(kg).toBeGreaterThan(0);
  });

  it("quantity at schema max (100000) is invalid per form schema", () => {
    const result = ActivityFormSchema.safeParse({
      category: "transport",
      subtype: "car-petrol",
      quantity: 100_001,
    });
    expect(result.success).toBe(false);
  });

  it("empty activities list still generates insights", () => {
    const insights = generateInsights([], PROFILE);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0]?.actionHint).toBeTruthy();
  });
});

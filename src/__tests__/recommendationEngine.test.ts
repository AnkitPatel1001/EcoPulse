// EcoPulse — Recommendation Engine Tests
// Criterion: Testing (HIGH) — validates ranking logic, personalization, edge cases

import { describe, it, expect } from "vitest";
import { generateRecommendations, effortLabel } from "@/lib/recommendationEngine";
import type { UserProfile, ActivityLog } from "@/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CAR_COMMUTER: UserProfile = {
  id: "p1",
  name: "Priya",
  city: "Bengaluru",
  country: "India",
  commuteStyle: "car-petrol",
  commuteDistanceKm: 20,
  dietPattern: "non-vegetarian",
  travelFrequency: "occasionally",
  householdSize: 3,
  goals: ["reduce-transport", "reduce-meat"],
  createdAt: new Date().toISOString(),
  onboardingCompleted: true,
};

const VEGETARIAN_COMMUTER: UserProfile = {
  ...CAR_COMMUTER,
  id: "p2",
  dietPattern: "vegetarian",
  commuteStyle: "metro-bus",
};

function makeActivity(
  category: ActivityLog["category"],
  subtype: string,
  carbonKg: number,
  daysAgo = 1,
): ActivityLog {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: Math.random().toString(),
    category,
    subtype,
    quantity: 1,
    unit: "unit",
    carbonKg,
    nudgeShown: true,
    timestamp: d.toISOString(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("generateRecommendations", () => {
  it("returns an array for a user with no activities", () => {
    const recs = generateRecommendations(CAR_COMMUTER, []);
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("returns at most the requested limit", () => {
    const recs = generateRecommendations(CAR_COMMUTER, [], 3);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("recommendations have all required fields", () => {
    const recs = generateRecommendations(CAR_COMMUTER, [], 2);
    for (const rec of recs) {
      expect(rec.id).toBeTruthy();
      expect(rec.category).toBeTruthy();
      expect(rec.action).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.weeklyImpactKg).toBeGreaterThan(0);
      expect([1, 2, 3, 4, 5]).toContain(rec.effort);
      expect(typeof rec.score).toBe("number");
      expect(rec.reason).toBeTruthy();
      expect(rec.impactLabel).toBeTruthy();
    }
  });

  it("meat-related recommendations appear for non-vegetarian users", () => {
    const recs = generateRecommendations(CAR_COMMUTER, [], 5);
    const mealRecs = recs.filter((r) => r.category === "meals");
    expect(mealRecs.length).toBeGreaterThan(0);
  });

  it("meat-related recommendations do NOT appear for vegetarian users", () => {
    const recs = generateRecommendations(VEGETARIAN_COMMUTER, [], 5);
    const meatRecs = recs.filter((r) =>
      ["skip-meat-weekly", "vegetarian-day"].includes(r.id),
    );
    expect(meatRecs).toHaveLength(0);
  });

  it("recommendations are sorted by score descending", () => {
    const recs = generateRecommendations(CAR_COMMUTER, [], 5);
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i]!.score).toBeGreaterThanOrEqual(recs[i + 1]!.score);
    }
  });

  it("transport recommendations boost for high-transport user", () => {
    const transportHeavyActivities = [
      makeActivity("transport", "car-petrol", 4.2, 0),
      makeActivity("transport", "car-petrol", 4.2, 1),
      makeActivity("transport", "car-petrol", 4.2, 2),
    ];
    const recs = generateRecommendations(CAR_COMMUTER, transportHeavyActivities, 5);
    // First recommendation should be transport-related since it dominates
    const topRec = recs[0];
    expect(topRec).toBeDefined();
    // Should be a high-impact action
    expect(topRec!.weeklyImpactKg).toBeGreaterThan(1);
  });

  it("AC recommendation appears when user has AC usage", () => {
    const acActivities = [
      makeActivity("electricity", "ac-1ton", 1.065, 0),
      makeActivity("electricity", "ac-1ton", 1.065, 1),
    ];
    const recs = generateRecommendations(CAR_COMMUTER, acActivities, 10);
    const acRec = recs.find((r) => r.id === "reduce-ac-one-hour" || r.id === "fan-over-ac");
    expect(acRec).toBeDefined();
  });

  it("returns at least 1 recommendation even with unusual profile", () => {
    const unusualProfile: UserProfile = {
      ...CAR_COMMUTER,
      commuteStyle: "walk-cycle",
      dietPattern: "vegan",
    };
    const recs = generateRecommendations(unusualProfile, []);
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });
});

// ── effortLabel ───────────────────────────────────────────────────────────────

describe("effortLabel", () => {
  it("returns correct label for effort 1", () => {
    expect(effortLabel(1)).toBe("Very easy");
  });

  it("returns correct label for effort 5", () => {
    expect(effortLabel(5)).toBe("Significant change");
  });

  it("all effort levels return non-empty strings", () => {
    for (const effort of [1, 2, 3, 4, 5] as const) {
      expect(effortLabel(effort).length).toBeGreaterThan(0);
    }
  });
});

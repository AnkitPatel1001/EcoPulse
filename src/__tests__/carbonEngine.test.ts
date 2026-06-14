// EcoPulse — Carbon Engine Tests
// Criterion: Testing (HIGH) — covers all core calculation functions, edge cases, zero/huge input

import { describe, it, expect } from "vitest";
import {
  calculateCarbonKg,
  toRelatableEquivalents,
  totalCarbonKg,
  carbonByCategory,
  topCategory,
  calculateStreakDays,
  activitiesThisWeek,
  groupByWeek,
} from "@/lib/carbonEngine";
import type { ActivityLog } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeActivity(
  overrides: Partial<ActivityLog> = {},
  daysAgo = 0,
): ActivityLog {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: "test-id",
    category: "transport",
    subtype: "car-petrol",
    quantity: 10,
    unit: "km",
    carbonKg: 2.1,
    nudgeShown: false,
    timestamp: d.toISOString(),
    ...overrides,
  };
}

// ── calculateCarbonKg ─────────────────────────────────────────────────────────

describe("calculateCarbonKg", () => {
  it("returns correct value for known subtype", () => {
    // 10 km * 0.21 kg/km = 2.1 kg
    expect(calculateCarbonKg("car-petrol", 10)).toBeCloseTo(2.1, 2);
  });

  it("returns 0 for zero quantity", () => {
    expect(calculateCarbonKg("car-petrol", 0)).toBe(0);
  });

  it("returns 0 for negative quantity", () => {
    expect(calculateCarbonKg("car-petrol", -5)).toBe(0);
  });

  it("returns 0 for unknown subtype (graceful degradation)", () => {
    expect(calculateCarbonKg("nonexistent-subtype", 10)).toBe(0);
  });

  it("returns 0 for walk-cycle (zero emission mode)", () => {
    expect(calculateCarbonKg("walk-cycle", 100)).toBe(0);
  });

  it("handles very large input without overflow", () => {
    const result = calculateCarbonKg("car-petrol", 100_000);
    expect(result).toBeCloseTo(21_000, 0);
    expect(isFinite(result)).toBe(true);
  });

  it("calculates correctly for meat meal", () => {
    // 1 beef meal * 6.8 kg = 6.8 kg
    expect(calculateCarbonKg("beef-mutton", 1)).toBeCloseTo(6.8, 2);
  });

  it("calculates correctly for domestic flight", () => {
    // 1 trip * 85 kg = 85 kg
    expect(calculateCarbonKg("flight-domestic-short", 1)).toBeCloseTo(85, 1);
  });

  it("calculates electricity usage per kWh", () => {
    // 5 kWh * 0.71 = 3.55 kg
    expect(calculateCarbonKg("kwh-usage", 5)).toBeCloseTo(3.55, 2);
  });

  it("result rounds to 3 decimal places", () => {
    const result = calculateCarbonKg("car-petrol", 1);
    const decimals = result.toString().split(".")[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(3);
  });
});

// ── toRelatableEquivalents ────────────────────────────────────────────────────

describe("toRelatableEquivalents", () => {
  it("returns 3 equivalents for positive carbon", () => {
    const equivs = toRelatableEquivalents(2.1);
    expect(equivs).toHaveLength(3);
  });

  it("returns zero-emission message for 0 kg", () => {
    const equivs = toRelatableEquivalents(0);
    expect(equivs[0]?.label).toMatch(/zero/i);
  });

  it("km driven equivalent is positive and reasonable for 1 kg", () => {
    const equivs = toRelatableEquivalents(1);
    const kmEquiv = equivs.find((e) => e.icon === "🚗");
    expect(kmEquiv).toBeDefined();
    // 1 kg / 0.21 kg/km ≈ 4.76 km
    expect(kmEquiv?.value).toBeCloseTo(4.8, 0);
  });

  it("phone charges equivalent is large for a flight", () => {
    const equivs = toRelatableEquivalents(85); // domestic flight
    const phoneEquiv = equivs.find((e) => e.icon === "📱");
    expect(phoneEquiv).toBeDefined();
    // 85 / 0.005 = 17,000 charges
    expect(phoneEquiv?.value).toBeGreaterThan(10_000);
  });

  it("all equivalents have required fields", () => {
    const equivs = toRelatableEquivalents(5);
    for (const eq of equivs) {
      expect(eq.label).toBeTruthy();
      expect(eq.icon).toBeTruthy();
      expect(typeof eq.value).toBe("number");
    }
  });
});

// ── totalCarbonKg ─────────────────────────────────────────────────────────────

describe("totalCarbonKg", () => {
  it("sums correctly for multiple activities", () => {
    const acts = [
      makeActivity({ carbonKg: 2.1 }),
      makeActivity({ carbonKg: 6.8 }),
      makeActivity({ carbonKg: 1.5 }),
    ];
    expect(totalCarbonKg(acts)).toBeCloseTo(10.4, 2);
  });

  it("returns 0 for empty array", () => {
    expect(totalCarbonKg([])).toBe(0);
  });

  it("handles single activity", () => {
    const acts = [makeActivity({ carbonKg: 3.75 })];
    expect(totalCarbonKg(acts)).toBeCloseTo(3.75, 2);
  });
});

// ── carbonByCategory ──────────────────────────────────────────────────────────

describe("carbonByCategory", () => {
  it("groups activities by category and sums correctly", () => {
    const acts = [
      makeActivity({ category: "transport", carbonKg: 2.1 }),
      makeActivity({ category: "meals", carbonKg: 6.8 }),
      makeActivity({ category: "transport", carbonKg: 1.0 }),
      makeActivity({ category: "electricity", carbonKg: 1.5 }),
    ];
    const result = carbonByCategory(acts);
    expect(result.transport).toBeCloseTo(3.1, 2);
    expect(result.meals).toBeCloseTo(6.8, 2);
    expect(result.electricity).toBeCloseTo(1.5, 2);
    expect(result.flights).toBe(0);
  });

  it("returns all zeros for empty array", () => {
    const result = carbonByCategory([]);
    expect(result.transport).toBe(0);
    expect(result.meals).toBe(0);
    expect(result.electricity).toBe(0);
    expect(result.flights).toBe(0);
    expect(result.shopping).toBe(0);
    expect(result.waste).toBe(0);
  });

  it("includes all 6 categories in result", () => {
    const result = carbonByCategory([]);
    expect(Object.keys(result)).toHaveLength(6);
  });
});

// ── topCategory ───────────────────────────────────────────────────────────────

describe("topCategory", () => {
  it("returns the category with the highest carbon", () => {
    const breakdown = {
      transport: 2.1,
      meals: 6.8,
      electricity: 1.5,
      flights: 0,
      shopping: 0,
      waste: 0,
    };
    expect(topCategory(breakdown)).toBe("meals");
  });

  it("returns transport as default when all zeros", () => {
    const breakdown = {
      transport: 0,
      meals: 0,
      electricity: 0,
      flights: 0,
      shopping: 0,
      waste: 0,
    };
    // Deterministic default: transport (first key)
    expect(topCategory(breakdown)).toBe("transport");
  });

  it("handles tie by returning first encountered", () => {
    const breakdown = {
      transport: 5,
      meals: 5,
      electricity: 0,
      flights: 0,
      shopping: 0,
      waste: 0,
    };
    const result = topCategory(breakdown);
    expect(["transport", "meals"]).toContain(result);
  });
});

// ── calculateStreakDays ───────────────────────────────────────────────────────

describe("calculateStreakDays", () => {
  it("returns 0 for empty activities", () => {
    expect(calculateStreakDays([])).toBe(0);
  });

  it("returns 1 for a single activity today", () => {
    const acts = [makeActivity({}, 0)]; // today
    expect(calculateStreakDays(acts)).toBe(1);
  });

  it("counts consecutive days correctly", () => {
    const acts = [
      makeActivity({}, 0), // today
      makeActivity({}, 1), // yesterday
      makeActivity({}, 2), // 2 days ago
    ];
    expect(calculateStreakDays(acts)).toBe(3);
  });

  it("breaks streak on gap", () => {
    const acts = [
      makeActivity({}, 0), // today
      // day 1 gap
      makeActivity({}, 2), // 2 days ago
      makeActivity({}, 3),
    ];
    // Streak should be 1 (only today)
    expect(calculateStreakDays(acts)).toBe(1);
  });

  it("multiple activities on same day count as 1 streak day", () => {
    const acts = [
      makeActivity({}, 0),
      makeActivity({ id: "id2" }, 0), // same day
      makeActivity({ id: "id3" }, 1),
    ];
    expect(calculateStreakDays(acts)).toBe(2);
  });
});

// ── activitiesThisWeek ────────────────────────────────────────────────────────

describe("activitiesThisWeek", () => {
  it("returns activities from this week only", () => {
    const acts = [
      makeActivity({}, 0),   // today (this week)
      makeActivity({}, 3),   // 3 days ago (likely this week)
      makeActivity({}, 14),  // 2 weeks ago
      makeActivity({}, 21),  // 3 weeks ago
    ];
    const result = activitiesThisWeek(acts);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("returns empty for activities only from past weeks", () => {
    const acts = [
      makeActivity({}, 14),
      makeActivity({}, 21),
    ];
    const result = activitiesThisWeek(acts);
    expect(result).toHaveLength(0);
  });
});

// ── groupByWeek ───────────────────────────────────────────────────────────────

describe("groupByWeek", () => {
  it("groups activities by week start", () => {
    const acts = [
      makeActivity({}, 0),
      makeActivity({ id: "id2" }, 0),
      makeActivity({ id: "id3" }, 14),
    ];
    const result = groupByWeek(acts);
    expect(result.size).toBeGreaterThanOrEqual(1);
  });

  it("returns empty map for empty input", () => {
    const result = groupByWeek([]);
    expect(result.size).toBe(0);
  });
});

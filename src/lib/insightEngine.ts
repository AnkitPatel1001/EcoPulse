// EcoPulse — Insight Engine
// Criterion: Problem Statement Alignment (HIGH) — "understand" pillar; explains patterns not numbers
// Criterion: Code Quality (HIGH) — pure functions, deterministic, testable without mocks

import { carbonByCategory, activitiesThisWeek, activitiesLastWeek, totalCarbonKg } from "@/lib/carbonEngine";
import type { ActivityLog, Insight, UserProfile, ActivityCategory } from "@/types";

// India average annual footprint is ~1.8 t CO₂/year ≈ 34.6 kg/week
const INDIA_AVG_WEEKLY_KG = 34.6;

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  transport: "commuting & transport",
  meals: "food & meals",
  electricity: "home electricity",
  flights: "flights",
  shopping: "shopping",
  waste: "waste",
};

let _insightCounter = 0;
function nextId(): string {
  return `insight-${++_insightCounter}-${Date.now()}`;
}

// ── Pattern detectors ─────────────────────────────────────────────────────────

function detectTopCategoryInsight(
  thisWeek: ActivityLog[],
  breakdown: Record<ActivityCategory, number>,
  totalKg: number,
): Insight | null {
  if (totalKg === 0) return null;

  let topCat: ActivityCategory = "transport";
  let topKg = 0;

  for (const [cat, kg] of Object.entries(breakdown)) {
    if (kg > topKg) {
      topKg = kg;
      topCat = cat as ActivityCategory;
    }
  }

  if (topKg === 0) return null;

  const pct = Math.round((topKg / totalKg) * 100);

  return {
    id: nextId(),
    category: topCat,
    title: `${CATEGORY_LABELS[topCat]} is your biggest source`,
    body: `${CATEGORY_LABELS[topCat]} accounts for ${pct}% of your footprint this week (${topKg.toFixed(1)} kg CO₂).`,
    actionHint: getActionHintForCategory(topCat, topKg, thisWeek),
    priority: pct > 50 ? "high" : "medium",
    generatedAt: new Date().toISOString(),
    source: "rule-based",
  };
}

function getActionHintForCategory(
  category: ActivityCategory,
  _kg: number,
  _activities: ActivityLog[],
): string {
  switch (category) {
    case "meals":
      return "One fewer meat meal per week is the highest-impact single change you can make here.";
    case "transport":
      return "Even one day of public transit instead of car makes a measurable difference.";
    case "electricity":
      return `Reducing AC use by 1 hour/day would save ~7.5 kg CO₂ this week alone.`;
    case "flights":
      return "Flights have an outsized impact. Offsetting or reducing frequency helps most.";
    case "shopping":
      return "Buying nothing for one week resets the habit and saves 8+ kg CO₂ per avoided purchase.";
    case "waste":
      return "Separating dry recyclables from wet waste reduces landfill methane emissions.";
    default:
      return `Focus on reducing ${category} activities for the biggest weekly impact.`;
  }
}

function detectWeekOnWeekChange(
  thisWeekKg: number,
  lastWeekKg: number,
): Insight | null {
  if (lastWeekKg === 0) return null;

  const delta = thisWeekKg - lastWeekKg;
  const pct = Math.round((Math.abs(delta) / lastWeekKg) * 100);

  if (Math.abs(pct) < 5) return null; // Not meaningful enough to surface

  const improved = delta < 0;

  return {
    id: nextId(),
    category: "overall",
    title: improved
      ? `Week-on-week: down ${pct}% — keep going`
      : `Week-on-week: up ${pct}% — let's understand why`,
    body: improved
      ? `Your footprint dropped by ${Math.abs(delta).toFixed(1)} kg CO₂ compared to last week. Small changes compound.`
      : `Your footprint is ${delta.toFixed(1)} kg CO₂ higher than last week. Check which category increased.`,
    actionHint: improved
      ? "Continue the habits that drove this improvement — consistency is what matters."
      : "Identify which category increased and focus your next action there.",
    priority: pct > 20 ? "high" : "medium",
    generatedAt: new Date().toISOString(),
    source: "rule-based",
  };
}

function detectMeatFrequency(activities: ActivityLog[]): Insight | null {
  const recentMeat = activities
    .slice(-14)
    .filter((a) => ["beef-mutton", "chicken"].includes(a.subtype));

  if (recentMeat.length === 0) return null;

  const meatCarbon = recentMeat.reduce((s, a) => s + a.carbonKg, 0);
  const beefCount = recentMeat.filter((a) => a.subtype === "beef-mutton").length;

  if (beefCount >= 2) {
    return {
      id: nextId(),
      category: "meals",
      title: "Ruminant meat is your highest-impact food choice",
      body: `You've had ${beefCount} beef/mutton meals in the past two weeks, producing ~${meatCarbon.toFixed(1)} kg CO₂. Beef produces 20× more CO₂ than vegetables per gram of protein.`,
      actionHint:
        "Swapping just one beef meal per week for vegetarian saves more CO₂ than skipping 30 km of car travel.",
      priority: "high",
      generatedAt: new Date().toISOString(),
      source: "rule-based",
    };
  }

  return null;
}

function detectFlightImpact(activities: ActivityLog[]): Insight | null {
  const recentFlights = activities.slice(-30).filter((a) => a.category === "flights");
  if (recentFlights.length === 0) return null;

  const flightCarbon = recentFlights.reduce((s, a) => s + a.carbonKg, 0);
  const weeksElectricity = Math.round((flightCarbon / (0.71 * 3 * 30)) * 10) / 10;

  return {
    id: nextId(),
    category: "flights",
    title: "Flights have an outsized carbon cost",
    body: `Your recent flight(s) produced ${flightCarbon.toFixed(0)} kg CO₂ — equivalent to ~${weeksElectricity} weeks of home electricity use.`,
    actionHint:
      "Consider train alternatives for routes under 800 km, or offset remaining flights through verified carbon programs.",
    priority: "high",
    generatedAt: new Date().toISOString(),
    source: "rule-based",
  };
}

function detectVsAverages(thisWeekKg: number): Insight | null {
  if (thisWeekKg === 0) return null;

  if (thisWeekKg < INDIA_AVG_WEEKLY_KG * 0.6) {
    return {
      id: nextId(),
      category: "overall",
      title: "You're well below the Indian average",
      body: `Your weekly footprint (${thisWeekKg.toFixed(1)} kg CO₂) is ${Math.round(((INDIA_AVG_WEEKLY_KG - thisWeekKg) / INDIA_AVG_WEEKLY_KG) * 100)}% below India's average of ~${INDIA_AVG_WEEKLY_KG} kg/week.`,
      actionHint:
        "You're doing well. Consider sharing your habits with others — behavior change spreads through social networks.",
      priority: "low",
      generatedAt: new Date().toISOString(),
      source: "rule-based",
    };
  }

  if (thisWeekKg > INDIA_AVG_WEEKLY_KG * 1.5) {
    return {
      id: nextId(),
      category: "overall",
      title: "Your footprint is above the Indian average this week",
      body: `Your footprint (${thisWeekKg.toFixed(1)} kg CO₂) is ${Math.round(((thisWeekKg - INDIA_AVG_WEEKLY_KG) / INDIA_AVG_WEEKLY_KG) * 100)}% above India's average of ~${INDIA_AVG_WEEKLY_KG} kg/week.`,
      actionHint:
        "Focus on your top emission category first — even one behavioral change there can bring you below average.",
      priority: "high",
      generatedAt: new Date().toISOString(),
      source: "rule-based",
    };
  }

  return null;
}

function detectLowLoggingInsight(activities: ActivityLog[]): Insight | null {
  const recentDays = 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentDays);
  const recentCount = activities.filter(
    (a) => new Date(a.timestamp) >= cutoff,
  ).length;

  if (recentCount === 0) {
    return {
      id: nextId(),
      category: "overall",
      title: "No recent activities logged",
      body:
        "Log at least one activity per day to get accurate insights. Even rough estimates are more valuable than nothing.",
      actionHint: "Log today's commute or biggest meal to start building your picture.",
      priority: "medium",
      generatedAt: new Date().toISOString(),
      source: "rule-based",
    };
  }

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate rule-based insights from activity history.
 * Always returns 1–5 actionable insights, ordered by priority.
 * @complexity O(n) — single pass through recent activities
 */
export function generateInsights(
  activities: ActivityLog[],
  _profile: UserProfile,
): Insight[] {
  const thisWeek = activitiesThisWeek(activities);
  const lastWeek = activitiesLastWeek(activities);
  const breakdown = carbonByCategory(thisWeek);
  const thisWeekKg = totalCarbonKg(thisWeek);
  const lastWeekKg = totalCarbonKg(lastWeek);

  const candidates: Array<Insight | null> = [
    detectTopCategoryInsight(thisWeek, breakdown, thisWeekKg),
    detectWeekOnWeekChange(thisWeekKg, lastWeekKg),
    detectMeatFrequency(activities),
    detectFlightImpact(activities),
    detectVsAverages(thisWeekKg),
    detectLowLoggingInsight(activities),
  ];

  const insights = candidates.filter((i): i is Insight => i !== null);

  // Sort: high priority first
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Always surface at least a default insight if nothing applies
  if (insights.length === 0) {
    insights.push({
      id: nextId(),
      category: "overall",
      title: "Keep logging to unlock insights",
      body:
        "Once you log a few activities, EcoPulse will detect patterns and show you exactly where to focus your energy.",
      actionHint: "Log today's commute, meals, or electricity usage to get started.",
      priority: "medium",
      generatedAt: new Date().toISOString(),
      source: "rule-based",
    });
  }

  return insights.slice(0, 5);
}

// EcoPulse — Demo seed data for first-time users
// Gives a realistic Indian urban professional's activity history

import { generateId, daysAgoISO } from "@/lib/utils";
import { calculateCarbonKg } from "@/lib/carbonEngine";
import type { ActivityLog, UserProfile } from "@/types";

export const DEMO_PROFILE: UserProfile = {
  id: generateId(),
  name: "Priya",
  city: "Bengaluru",
  country: "India",
  commuteStyle: "car-petrol",
  commuteDistanceKm: 18,
  dietPattern: "non-vegetarian",
  travelFrequency: "occasionally",
  householdSize: 3,
  goals: ["reduce-transport", "reduce-meat", "overall-reduction"],
  createdAt: daysAgoISO(14),
  onboardingCompleted: true,
};

function makeActivity(
  category: ActivityLog["category"],
  subtype: string,
  quantity: number,
  daysAgo: number,
): ActivityLog {
  return {
    id: generateId(),
    category,
    subtype,
    quantity,
    unit: "km",
    carbonKg: calculateCarbonKg(subtype, quantity),
    nudgeShown: true,
    timestamp: daysAgoISO(daysAgo),
  };
}

export const DEMO_ACTIVITIES: ActivityLog[] = [
  // Week 2 ago (higher footprint — before the user started being mindful)
  makeActivity("transport", "car-petrol", 18, 14),
  makeActivity("meals", "beef-mutton", 1, 14),
  makeActivity("transport", "car-petrol", 18, 13),
  makeActivity("meals", "chicken", 1, 13),
  makeActivity("electricity", "ac-1ton", 6, 13),
  makeActivity("transport", "car-petrol", 18, 12),
  makeActivity("meals", "chicken", 1, 12),
  makeActivity("electricity", "ac-1ton", 5, 12),
  makeActivity("transport", "car-petrol", 20, 11),
  makeActivity("meals", "beef-mutton", 1, 11),
  makeActivity("shopping", "clothing-item", 1, 11),
  makeActivity("transport", "car-petrol", 18, 10),
  makeActivity("meals", "vegetarian", 1, 10),
  makeActivity("electricity", "ac-1ton", 4, 10),
  makeActivity("transport", "car-petrol", 18, 9),
  makeActivity("meals", "fish", 1, 9),

  // This week (slightly improved)
  makeActivity("transport", "metro-bus", 18, 7),
  makeActivity("meals", "vegetarian", 1, 7),
  makeActivity("electricity", "ac-1ton", 3, 7),
  makeActivity("transport", "car-petrol", 18, 6),
  makeActivity("meals", "chicken", 1, 6),
  makeActivity("electricity", "fan", 5, 6),
  makeActivity("transport", "metro-bus", 18, 5),
  makeActivity("meals", "vegetarian", 1, 5),
  makeActivity("electricity", "ac-1ton", 4, 5),
  makeActivity("transport", "two-wheeler", 18, 4),
  makeActivity("meals", "eggs", 1, 4),
  makeActivity("electricity", "laptop", 8, 4),
  makeActivity("transport", "metro-bus", 18, 3),
  makeActivity("meals", "fish", 1, 3),
  makeActivity("transport", "car-petrol", 18, 2),
  makeActivity("meals", "chicken", 1, 2),
  makeActivity("electricity", "ac-1ton", 5, 2),
  makeActivity("transport", "metro-bus", 18, 1),
  makeActivity("meals", "vegetarian", 1, 1),
  makeActivity("electricity", "fan", 6, 1),
];

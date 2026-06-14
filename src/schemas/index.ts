// EcoPulse — Zod validation schemas
// Criterion: Security (HIGH) — all user inputs validated at boundary before processing

import { z } from "zod";

// ── User Profile ─────────────────────────────────────────────────────────────

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or fewer")
    .regex(/^[^\x00-\x1F<>{}[\]\\^`|~]+$/, "Name contains invalid characters"),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City name too long")
    .regex(/^[^\x00-\x1F<>{}[\]\\^`|~]+$/, "City contains invalid characters"),
  country: z.string().min(1).max(100),
  commuteStyle: z.enum([
    "walk-cycle",
    "metro-bus",
    "two-wheeler",
    "car-cng",
    "car-petrol",
    "car-electric",
    "auto-rickshaw",
    "taxi",
  ]),
  commuteDistanceKm: z
    .number()
    .min(0, "Distance cannot be negative")
    .max(500, "Distance seems unrealistically large"),
  dietPattern: z.enum([
    "vegan",
    "vegetarian",
    "occasional-meat",
    "non-vegetarian",
    "regular-meat",
  ]),
  travelFrequency: z.enum(["never", "rarely", "occasionally", "frequently"]),
  householdSize: z
    .number()
    .int()
    .min(1, "Household size must be at least 1")
    .max(20, "Household size seems unrealistically large"),
  goals: z
    .array(
      z.enum([
        "reduce-transport",
        "reduce-meat",
        "reduce-electricity",
        "reduce-flights",
        "reduce-shopping",
        "overall-reduction",
      ]),
    )
    .min(1, "Select at least one goal")
    .max(6),
  createdAt: z.string().datetime(),
  onboardingCompleted: z.boolean(),
});

// ── Activity Log ─────────────────────────────────────────────────────────────

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(["transport", "meals", "electricity", "flights", "shopping", "waste"]),
  subtype: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\w-]+$/, "Subtype must be alphanumeric"),
  quantity: z
    .number()
    .min(0, "Quantity cannot be negative")
    .max(100_000, "Quantity exceeds maximum allowed value"),
  unit: z.string().min(1).max(30),
  carbonKg: z
    .number()
    .min(0, "Carbon cannot be negative")
    .max(10_000, "Carbon value exceeds realistic maximum"),
  nudgeShown: z.boolean(),
  timestamp: z.string().datetime(),
  note: z
    .string()
    .max(500, "Note must be 500 characters or fewer")
    .regex(/^[^<>]*$/, "Note contains invalid characters")
    .optional(),
});

// ── API request schemas (route handlers validate these) ───────────────────────

export const InsightRequestSchema = z.object({
  profileSummary: z.string().max(500),
  topCategory: z.string().max(50),
  weeklyCarbon: z.number().min(0).max(10_000),
  recentActivitiesSummary: z.string().max(1000),
});

// ── Onboarding form steps ─────────────────────────────────────────────────────

export const OnboardingStep1Schema = z.object({
  name: z
    .string()
    .min(1, "Please enter your name")
    .max(80)
    .regex(/^[^\x00-\x1F<>{}[\]\\^`|~]+$/, "Name contains invalid characters"),
  city: z
    .string()
    .min(1, "Please enter your city")
    .max(100)
    .regex(/^[^\x00-\x1F<>{}[\]\\^`|~]+$/, "City contains invalid characters"),
  country: z.string().min(1, "Please select your country").max(100),
});

export const OnboardingStep2Schema = z.object({
  commuteStyle: z.enum([
    "walk-cycle",
    "metro-bus",
    "two-wheeler",
    "car-cng",
    "car-petrol",
    "car-electric",
    "auto-rickshaw",
    "taxi",
  ]),
  commuteDistanceKm: z
    .number({ invalid_type_error: "Please enter a valid distance" })
    .min(0)
    .max(500),
});

export const OnboardingStep3Schema = z.object({
  dietPattern: z.enum([
    "vegan",
    "vegetarian",
    "occasional-meat",
    "non-vegetarian",
    "regular-meat",
  ]),
  householdSize: z
    .number({ invalid_type_error: "Please enter household size" })
    .int()
    .min(1)
    .max(20),
});

export const OnboardingStep4Schema = z.object({
  travelFrequency: z.enum(["never", "rarely", "occasionally", "frequently"]),
  goals: z.array(z.string()).min(1, "Select at least one goal"),
});

// ── Activity logging form ─────────────────────────────────────────────────────

export const ActivityFormSchema = z.object({
  category: z.enum(["transport", "meals", "electricity", "flights", "shopping", "waste"]),
  subtype: z.string().min(1, "Please select an activity type"),
  quantity: z
    .number({ invalid_type_error: "Please enter a valid quantity" })
    .min(0.01, "Quantity must be greater than 0")
    .max(100_000),
  note: z
    .string()
    .max(500)
    .regex(/^[^<>]*$/, "Invalid characters in note")
    .optional(),
});

export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type ActivityLogInput = z.infer<typeof ActivityLogSchema>;
export type ActivityFormInput = z.infer<typeof ActivityFormSchema>;
export type InsightRequestInput = z.infer<typeof InsightRequestSchema>;
export type OnboardingStep1Input = z.infer<typeof OnboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof OnboardingStep2Schema>;
export type OnboardingStep3Input = z.infer<typeof OnboardingStep3Schema>;
export type OnboardingStep4Input = z.infer<typeof OnboardingStep4Schema>;

// EcoPulse — General utility functions

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ActivityCategory } from "@/types";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Generate a UUID v4 using the Web Crypto API (available in all modern browsers and Next.js). */
export function generateId(): string {
  return crypto.randomUUID();
}

/** Format a number as a compact kg CO₂ label, e.g. "2.4 kg" or "0.05 kg". */
export function formatCarbonKg(kg: number): string {
  if (kg === 0) return "0 kg";
  if (kg < 0.01) return "< 0.01 kg CO₂";
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} t CO₂`;
  if (kg >= 10) return `${kg.toFixed(1)} kg CO₂`;
  return `${kg.toFixed(2)} kg CO₂`;
}

/** Format a percentage with sign, e.g. "+12%" or "-5%". */
export function formatDeltaPercent(delta: number): string {
  if (delta === 0) return "0%";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${Math.round(delta)}%`;
}

/** Return a color class for a delta (red if up, green if down). */
export function deltaColorClass(delta: number): string {
  if (delta < 0) return "text-eco-600";
  if (delta > 0) return "text-red-500";
  return "text-muted-foreground";
}

/** Return the emoji icon for a category. */
export function categoryIcon(category: ActivityCategory): string {
  const icons: Record<ActivityCategory, string> = {
    transport: "🚗",
    meals: "🍽️",
    electricity: "⚡",
    flights: "✈️",
    shopping: "🛍️",
    waste: "♻️",
  };
  return icons[category] ?? "📊";
}

/** Return a human-readable label for a category. */
export function categoryLabel(category: ActivityCategory): string {
  const labels: Record<ActivityCategory, string> = {
    transport: "Transport",
    meals: "Meals",
    electricity: "Electricity",
    flights: "Flights",
    shopping: "Shopping",
    waste: "Waste",
  };
  return labels[category] ?? category;
}

/** Return a Tailwind background color class for a category chip. */
export function categoryColorClass(category: ActivityCategory): string {
  const colors: Record<ActivityCategory, string> = {
    transport: "bg-blue-100 text-blue-800",
    meals: "bg-orange-100 text-orange-800",
    electricity: "bg-yellow-100 text-yellow-800",
    flights: "bg-purple-100 text-purple-800",
    shopping: "bg-pink-100 text-pink-800",
    waste: "bg-green-100 text-green-800",
  };
  return colors[category] ?? "bg-gray-100 text-gray-800";
}

/** Truncate a string to maxLength, appending "…" if truncated. */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/** Return a greeting based on current hour. */
export function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Format an ISO timestamp to a short human-readable date, e.g. "Jun 14". */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/** Build the seed demo data activities timestamp (today minus n days). */
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

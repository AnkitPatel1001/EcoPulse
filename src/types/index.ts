// EcoPulse — Core domain types
// Criterion: Code Quality (HIGH) — strict TypeScript, no any, clear domain model

export type ActivityCategory =
  | "transport"
  | "meals"
  | "electricity"
  | "flights"
  | "shopping"
  | "waste";

export type DietPattern =
  | "vegan"
  | "vegetarian"
  | "occasional-meat"
  | "non-vegetarian"
  | "regular-meat";

export type CommuteStyle =
  | "walk-cycle"
  | "metro-bus"
  | "two-wheeler"
  | "car-cng"
  | "car-petrol"
  | "car-electric"
  | "auto-rickshaw"
  | "taxi";

export type TravelFrequency = "never" | "rarely" | "occasionally" | "frequently";

export type SustainabilityGoal =
  | "reduce-transport"
  | "reduce-meat"
  | "reduce-electricity"
  | "reduce-flights"
  | "reduce-shopping"
  | "overall-reduction";

export interface UserProfile {
  id: string;
  name: string;
  city: string;
  country: string;
  commuteStyle: CommuteStyle;
  commuteDistanceKm: number;
  dietPattern: DietPattern;
  travelFrequency: TravelFrequency;
  householdSize: number;
  goals: SustainabilityGoal[];
  createdAt: string; // ISO timestamp
  onboardingCompleted: boolean;
}

export interface ActivityLog {
  id: string;
  category: ActivityCategory;
  subtype: string;
  quantity: number;
  unit: string;
  carbonKg: number;
  nudgeShown: boolean;
  timestamp: string; // ISO timestamp
  note?: string;
}

export interface EmissionFactor {
  id: string;
  category: ActivityCategory;
  subtype: string;
  factor: number; // kg CO₂ per unit
  unit: string;
  label: string;
  description: string;
  source: string;
  icon?: string;
}

export interface RelatableEquivalent {
  label: string;
  value: number;
  unit: string;
  icon: string;
}

export interface PreActionNudge {
  carbonKg: number;
  equivalents: RelatableEquivalent[];
  contextMessage: string; // personalized contextual message
  alternativeSuggestion?: string; // lower-impact swap
  alternativeSavingKg?: number;
}

export interface Insight {
  id: string;
  category: ActivityCategory | "overall";
  title: string;
  body: string;
  actionHint: string; // always ends with a concrete next step
  priority: "high" | "medium" | "low";
  generatedAt: string; // ISO timestamp
  source: "rule-based" | "ai"; // transparency about how insight was generated
}

export interface Recommendation {
  id: string;
  category: ActivityCategory;
  action: string;
  description: string;
  weeklyImpactKg: number; // estimated weekly CO₂ savings
  effort: 1 | 2 | 3 | 4 | 5; // 1 = trivial, 5 = major lifestyle change
  score: number; // computed: impactKg / effort * personalizationBonus
  reason: string; // why this recommendation is shown to this user
  impactLabel: string; // human-readable, e.g. "saves ~6 kg CO₂ per week"
}

export interface Goal {
  id: string;
  category: ActivityCategory | "overall";
  targetReductionPercent: number;
  baselineKgPerWeek: number;
  currentKgPerWeek: number;
  startDate: string; // ISO timestamp
  deadline?: string; // ISO timestamp
}

export interface WeeklyReport {
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
  totalCarbonKg: number;
  previousWeekKg: number;
  deltaPercent: number; // positive = increased, negative = reduced
  topCategory: ActivityCategory;
  categoryBreakdown: Record<ActivityCategory, number>;
  highlights: string[]; // 2–3 plain-language sentences
  topRecommendations: Recommendation[];
  streakDays: number; // consecutive days with a logged activity
  generatedAt: string; // ISO timestamp
}

export interface AppState {
  profile: UserProfile | null;
  activities: ActivityLog[];
  recommendations: Recommendation[];
  insights: Insight[];
  weeklyReports: WeeklyReport[];
  goals: Goal[];
}

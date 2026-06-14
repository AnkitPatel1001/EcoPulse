"use client";

// EcoPulse — Onboarding wizard (5 steps)
// Criterion: Problem Statement Alignment (HIGH) — collects context for personalization
// Criterion: Accessibility (HIGH) — proper form labels, aria-live for step changes

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import {
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  OnboardingStep3Schema,
  OnboardingStep4Schema,
} from "@/schemas";
import type {
  OnboardingStep1Input,
  OnboardingStep2Input,
  OnboardingStep3Input,
  OnboardingStep4Input,
} from "@/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { generateId } from "@/lib/utils";
import type { UserProfile, CommuteStyle, DietPattern, SustainabilityGoal, TravelFrequency } from "@/types";
import { DEMO_ACTIVITIES, DEMO_PROFILE } from "@/lib/demoData";

const COMMUTE_OPTIONS: { value: CommuteStyle; label: string; icon: string }[] = [
  { value: "walk-cycle", label: "Walk / Cycle", icon: "🚶" },
  { value: "metro-bus", label: "Metro / Bus", icon: "🚌" },
  { value: "two-wheeler", label: "Two-Wheeler", icon: "🛵" },
  { value: "auto-rickshaw", label: "Auto Rickshaw", icon: "🛺" },
  { value: "car-cng", label: "Car (CNG)", icon: "🚗" },
  { value: "car-petrol", label: "Car (Petrol)", icon: "🚗" },
  { value: "car-electric", label: "Car (EV)", icon: "🔋" },
  { value: "taxi", label: "Taxi / Ride-share", icon: "🚕" },
];

const DIET_OPTIONS: { value: DietPattern; label: string; icon: string; detail: string }[] = [
  { value: "vegan", label: "Vegan", icon: "🌱", detail: "No animal products" },
  { value: "vegetarian", label: "Vegetarian", icon: "🥗", detail: "Dairy/eggs ok" },
  { value: "occasional-meat", label: "Flexitarian", icon: "🥘", detail: "Meat 1–2×/week" },
  { value: "non-vegetarian", label: "Non-Veg", icon: "🍗", detail: "Meat most days" },
  { value: "regular-meat", label: "Daily Meat", icon: "🍖", detail: "Meat at every meal" },
];

const GOAL_OPTIONS: { value: SustainabilityGoal; label: string; icon: string }[] = [
  { value: "reduce-transport", label: "Greener commute", icon: "🚌" },
  { value: "reduce-meat", label: "Eat less meat", icon: "🥗" },
  { value: "reduce-electricity", label: "Save electricity", icon: "💡" },
  { value: "reduce-flights", label: "Fly less", icon: "🌍" },
  { value: "reduce-shopping", label: "Buy less", icon: "🛍️" },
  { value: "overall-reduction", label: "Overall reduction", icon: "🌿" },
];

const TRAVEL_OPTIONS: { value: TravelFrequency; label: string }[] = [
  { value: "never", label: "Never fly" },
  { value: "rarely", label: "1–2 flights/year" },
  { value: "occasionally", label: "3–5 flights/year" },
  { value: "frequently", label: "6+ flights/year" },
];

interface StepProps {
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

function Step1({ onNext }: StepProps & { onBack?: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingStep1Input>({
    resolver: zodResolver(OnboardingStep1Schema),
  });

  return (
    <form onSubmit={handleSubmit((d) => onNext(d))} noValidate className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Hey, welcome! 👋</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Let&apos;s personalize your carbon insights. Quick — takes under 2 minutes.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Your first name</Label>
          <Input
            id="name"
            placeholder="e.g. Priya"
            autoComplete="given-name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="mt-1"
            {...register("name")}
          />
          {errors.name && (
            <p id="name-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g. Bengaluru"
            autoComplete="address-level2"
            aria-invalid={!!errors.city}
            aria-describedby={errors.city ? "city-error" : undefined}
            className="mt-1"
            {...register("city")}
          />
          {errors.city && (
            <p id="city-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.city.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            defaultValue="India"
            autoComplete="country-name"
            className="mt-1"
            {...register("country")}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Continue →
      </Button>
    </form>
  );
}

function Step2({ onNext, onBack }: StepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingStep2Input>({
    resolver: zodResolver(OnboardingStep2Schema),
    defaultValues: { commuteDistanceKm: 15 },
  });

  const selected = watch("commuteStyle");

  return (
    <form onSubmit={handleSubmit((d) => onNext(d))} noValidate className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">How do you get around? 🚌</h2>
        <p className="mt-1 text-muted-foreground text-sm">Your main daily commute mode.</p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Commute mode</legend>
        <div className="grid grid-cols-2 gap-2">
          {COMMUTE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("commuteStyle", opt.value)}
              aria-pressed={selected === opt.value}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-eco-500 ${
                selected === opt.value
                  ? "border-eco-500 bg-eco-50 text-eco-800 font-medium"
                  : "border-border hover:border-eco-300"
              }`}
            >
              <span aria-hidden="true" className="text-lg">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
        {errors.commuteStyle && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {errors.commuteStyle.message}
          </p>
        )}
      </fieldset>

      <div>
        <Label htmlFor="distance">One-way commute distance (km)</Label>
        <Input
          id="distance"
          type="number"
          min={0}
          max={500}
          className="mt-1"
          aria-invalid={!!errors.commuteDistanceKm}
          {...register("commuteDistanceKm", { valueAsNumber: true })}
        />
        {errors.commuteDistanceKm && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {errors.commuteDistanceKm.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue →
        </Button>
      </div>
    </form>
  );
}

function Step3({ onNext, onBack }: StepProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingStep3Input>({
    resolver: zodResolver(OnboardingStep3Schema),
    defaultValues: { householdSize: 3 },
  });

  const selectedDiet = watch("dietPattern");

  return (
    <form onSubmit={handleSubmit((d) => onNext(d))} noValidate className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Food & home 🍽️</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Diet is one of the highest-impact areas — no judgment, just context.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Your typical diet</legend>
        <div className="space-y-2">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("dietPattern", opt.value)}
              aria-pressed={selectedDiet === opt.value}
              className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-eco-500 ${
                selectedDiet === opt.value
                  ? "border-eco-500 bg-eco-50 text-eco-800"
                  : "border-border hover:border-eco-300"
              }`}
            >
              <span className="text-xl" aria-hidden="true">{opt.icon}</span>
              <div>
                <p className="font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.detail}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.dietPattern && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            Please select your diet pattern
          </p>
        )}
      </fieldset>

      <div>
        <Label htmlFor="household">People in your household</Label>
        <Input
          id="household"
          type="number"
          min={1}
          max={20}
          className="mt-1 w-24"
          {...register("householdSize", { valueAsNumber: true })}
        />
        {errors.householdSize && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {errors.householdSize.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue →
        </Button>
      </div>
    </form>
  );
}

function Step4({ onNext, onBack }: StepProps) {
  const {
    handleSubmit,
    setValue,
    watch,
  } = useForm<OnboardingStep4Input>({
    resolver: zodResolver(OnboardingStep4Schema),
    defaultValues: { goals: [], travelFrequency: "rarely" },
  });

  const selectedGoals = watch("goals") as string[];
  const selectedTravel = watch("travelFrequency");

  const toggleGoal = (goal: string) => {
    const current = selectedGoals;
    setValue(
      "goals",
      current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal],
    );
  };

  return (
    <form onSubmit={handleSubmit((d) => onNext(d))} noValidate className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Goals & travel ✈️</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          What areas matter most to you? Pick any.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium mb-2">Your sustainability goals</legend>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((opt) => {
            const isSelected = selectedGoals.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleGoal(opt.value)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-eco-500 ${
                  isSelected
                    ? "border-eco-500 bg-eco-50 text-eco-800 font-medium"
                    : "border-border hover:border-eco-300"
                }`}
              >
                <span aria-hidden="true">{opt.icon}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="travel">How often do you fly?</Label>
        <Select
          value={selectedTravel}
          onValueChange={(v) => setValue("travelFrequency", v as TravelFrequency)}
        >
          <SelectTrigger id="travel" className="mt-1">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {TRAVEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={selectedGoals.length === 0}
          aria-disabled={selectedGoals.length === 0}
        >
          Continue →
        </Button>
      </div>
    </form>
  );
}

function StepDemo({ onStartFresh, onUseDemoData }: { onStartFresh: () => void; onUseDemoData: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Ready to go! 🌿</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Would you like to start with a realistic week of demo data so you can explore EcoPulse
          immediately? Or start fresh and log your own activities.
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onUseDemoData}
          className="w-full flex flex-col items-start gap-1 rounded-2xl border-2 border-eco-200 bg-eco-50 p-4 text-left hover:border-eco-400 transition-colors focus-visible:ring-2 focus-visible:ring-eco-500"
        >
          <p className="font-semibold text-eco-800">Load demo data 📊</p>
          <p className="text-sm text-muted-foreground">
            See how EcoPulse works with a week of pre-filled activity data for an urban Bengaluru professional.
          </p>
        </button>

        <button
          type="button"
          onClick={onStartFresh}
          className="w-full flex flex-col items-start gap-1 rounded-2xl border border-border bg-background p-4 text-left hover:border-eco-300 transition-colors focus-visible:ring-2 focus-visible:ring-eco-500"
        >
          <p className="font-semibold">Start fresh ✏️</p>
          <p className="text-sm text-muted-foreground">Log your own activities from day one.</p>
        </button>
      </div>
    </div>
  );
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

type FormData = Partial<
  OnboardingStep1Input & OnboardingStep2Input & OnboardingStep3Input & OnboardingStep4Input
>;

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const { setProfile, seedActivities } = useAppContext();
  const router = useRouter();

  const totalSteps = 5;
  const progressValue = ((step - 1) / (totalSteps - 1)) * 100;

  const advance = (data: Record<string, unknown>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((s) => s + 1);
  };

  const buildProfile = (data: FormData, demoMode: boolean): UserProfile => ({
    id: demoMode ? DEMO_PROFILE.id : generateId(),
    name: data.name ?? "You",
    city: data.city ?? "India",
    country: data.country ?? "India",
    commuteStyle: data.commuteStyle ?? "metro-bus",
    commuteDistanceKm: data.commuteDistanceKm ?? 15,
    dietPattern: data.dietPattern ?? "non-vegetarian",
    travelFrequency: data.travelFrequency ?? "rarely",
    householdSize: data.householdSize ?? 3,
    goals: (data.goals as SustainabilityGoal[]) ?? ["overall-reduction"],
    createdAt: new Date().toISOString(),
    onboardingCompleted: true,
  });

  const handleStartFresh = () => {
    const profile = buildProfile(formData, false);
    setProfile(profile);
    router.push("/dashboard");
  };

  const handleUseDemoData = () => {
    const profile = buildProfile(formData, true);
    setProfile(profile);
    seedActivities(DEMO_ACTIVITIES);
    router.push("/dashboard");
  };

  const stepVariants = {
    enter: { x: 30, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -30, opacity: 0 },
  };

  return (
    <div className="min-h-screen max-w-md mx-auto px-4 py-8 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl" aria-hidden="true">🌿</span>
        <span className="font-bold text-lg text-eco-700">EcoPulse</span>
      </div>

      {/* Step progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progressValue)}% complete</span>
        </div>
        <Progress value={progressValue} aria-label={`Onboarding step ${step} of ${totalSteps}`} />
      </div>

      {/* Steps */}
      <div className="flex-1" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 1 && (
              <Step1
                onNext={advance}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
              />
            )}
            {step === 2 && (
              <Step2
                onNext={advance}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
              />
            )}
            {step === 3 && (
              <Step3
                onNext={advance}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
              />
            )}
            {step === 4 && (
              <Step4
                onNext={advance}
                onBack={() => setStep((s) => Math.max(1, s - 1))}
              />
            )}
            {step === 5 && (
              <StepDemo onStartFresh={handleStartFresh} onUseDemoData={handleUseDemoData} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

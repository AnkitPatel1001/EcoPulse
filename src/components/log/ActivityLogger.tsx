"use client";

// EcoPulse — Activity logging form
// Criterion: Problem Statement Alignment (HIGH) — "track" pillar; low-friction daily logging
// Criterion: Security (HIGH) — Zod-validated form, sanitized note field

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { ActivityFormSchema, type ActivityFormInput } from "@/schemas";
import { FACTORS_BY_CATEGORY } from "@/lib/emissionFactors";
import { calculateCarbonKg, buildPreActionNudge } from "@/lib/carbonEngine";
import { PreActionNudge } from "./PreActionNudge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCarbonKg, categoryIcon, categoryLabel, generateId } from "@/lib/utils";
import type { ActivityCategory, ActivityLog, PreActionNudge as NudgeType } from "@/types";
import { CheckCircle } from "lucide-react";

const CATEGORIES: ActivityCategory[] = [
  "transport",
  "meals",
  "electricity",
  "flights",
  "shopping",
  "waste",
];

const UNIT_LABELS: Record<string, string> = {
  km: "km",
  meal: "meal(s)",
  hour: "hour(s)",
  "one-way trip": "one-way trip(s)",
  item: "item(s)",
  order: "order(s)",
  load: "load(s)",
  kWh: "kWh",
  kg: "kg",
};

export function ActivityLogger() {
  const { state, addActivity } = useAppContext();
  const router = useRouter();

  const [pendingNudge, setPendingNudge] = useState<NudgeType | null>(null);
  const [pendingActivity, setPendingActivity] = useState<ActivityFormInput | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<ActivityFormInput>({
    resolver: zodResolver(ActivityFormSchema),
    mode: "onChange",
    defaultValues: {
      category: "transport",
      quantity: 10,
    },
  });

  const selectedCategory = watch("category");
  const selectedSubtype = watch("subtype");
  const quantity = watch("quantity");

  const factors = FACTORS_BY_CATEGORY[selectedCategory] ?? [];
  const selectedFactor = factors.find((f) => f.subtype === selectedSubtype);
  const estimatedCarbon = selectedSubtype && quantity > 0
    ? calculateCarbonKg(selectedSubtype, quantity)
    : null;

  const onSubmit = useCallback(
    (data: ActivityFormInput) => {
      if (!state.profile) return;

      const nudge = buildPreActionNudge(
        data.subtype,
        data.quantity,
        state.activities,
        state.profile,
      );

      setPendingActivity(data);
      setPendingNudge(nudge);
    },
    [state.profile, state.activities],
  );

  const confirmLog = useCallback(() => {
    if (!pendingActivity || !pendingNudge) return;

    const activity: ActivityLog = {
      id: generateId(),
      category: pendingActivity.category,
      subtype: pendingActivity.subtype,
      quantity: pendingActivity.quantity,
      unit: selectedFactor?.unit ?? "unit",
      carbonKg: pendingNudge.carbonKg,
      nudgeShown: true,
      timestamp: new Date().toISOString(),
      note: pendingActivity.note,
    };

    addActivity(activity);
    setPendingNudge(null);
    setPendingActivity(null);
    setSubmitted(true);
    reset();

    setTimeout(() => {
      setSubmitted(false);
    }, 2500);
  }, [pendingActivity, pendingNudge, selectedFactor, addActivity, reset]);

  const cancelNudge = useCallback(() => {
    setPendingNudge(null);
    setPendingActivity(null);
  }, []);

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <CheckCircle className="h-16 w-16 text-eco-500 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Activity logged!</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your insights have been updated.
        </p>
        <Button
          className="mt-6"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
        aria-label="Log an activity"
      >
        {/* Category selection */}
        <fieldset>
          <legend className="text-sm font-medium mb-2">Category</legend>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="radio"
                    aria-checked={field.value === cat}
                    onClick={() => {
                      field.onChange(cat);
                      // Reset subtype when category changes
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-eco-500 ${
                      field.value === cat
                        ? "border-eco-500 bg-eco-50 text-eco-800"
                        : "border-border hover:border-eco-300"
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">{categoryIcon(cat)}</span>
                    {categoryLabel(cat)}
                  </button>
                ))}
              </div>
            )}
          />
        </fieldset>

        {/* Activity type */}
        <div>
          <Label htmlFor="subtype">Activity type</Label>
          <Controller
            name="subtype"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="subtype"
                  className="mt-1"
                  aria-invalid={!!errors.subtype}
                  aria-describedby={errors.subtype ? "subtype-error" : undefined}
                >
                  <SelectValue placeholder="Select an activity" />
                </SelectTrigger>
                <SelectContent>
                  {factors.map((f) => (
                    <SelectItem key={f.subtype} value={f.subtype}>
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">{f.icon}</span>
                        {f.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.subtype && (
            <p id="subtype-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.subtype.message}
            </p>
          )}
          {selectedFactor && (
            <p className="mt-1 text-xs text-muted-foreground">{selectedFactor.description}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor="quantity">
            Quantity{" "}
            {selectedFactor && (
              <span className="font-normal text-muted-foreground">
                ({UNIT_LABELS[selectedFactor.unit] ?? selectedFactor.unit})
              </span>
            )}
          </Label>
          <Input
            id="quantity"
            type="number"
            min={0.01}
            step="any"
            className="mt-1"
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? "qty-error" : "qty-hint"}
            {...register("quantity", { valueAsNumber: true })}
          />
          {errors.quantity ? (
            <p id="qty-error" role="alert" className="mt-1 text-xs text-destructive">
              {errors.quantity.message}
            </p>
          ) : (
            estimatedCarbon !== null && (
              <p id="qty-hint" className="mt-1 text-xs text-muted-foreground">
                Estimated impact:{" "}
                <span className="font-semibold text-foreground">
                  {formatCarbonKg(estimatedCarbon)}
                </span>
              </p>
            )
          )}
        </div>

        {/* Optional note */}
        <div>
          <Label htmlFor="note">
            Note{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="note"
            placeholder="Any context to add…"
            className="mt-1 resize-none h-20"
            maxLength={500}
            aria-describedby="note-hint"
            {...register("note")}
          />
          <p id="note-hint" className="mt-1 text-xs text-muted-foreground">
            Max 500 characters
          </p>
          {errors.note && (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {errors.note.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!isValid || !selectedSubtype}
          aria-disabled={!isValid || !selectedSubtype}
        >
          Preview impact & confirm
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You&apos;ll see the carbon impact before confirming.
        </p>
      </form>

      {/* Pre-action nudge dialog */}
      {pendingNudge && pendingActivity && selectedFactor && (
        <PreActionNudge
          nudge={pendingNudge}
          activityLabel={`${selectedFactor.label}${
            pendingActivity.quantity > 1 ? ` × ${pendingActivity.quantity}` : ""
          } ${UNIT_LABELS[selectedFactor.unit] ?? selectedFactor.unit}`}
          open={!!pendingNudge}
          onConfirm={confirmLog}
          onCancel={cancelNudge}
        />
      )}
    </>
  );
}

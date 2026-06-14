"use client";

// EcoPulse — Pre-Action Nudge (SIGNATURE FEATURE)
// Criterion: Problem Statement Alignment (HIGH) — makes invisible carbon personal and visible
// Shown BEFORE the user confirms a logged activity — this is the core awareness mechanism

import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCarbonKg } from "@/lib/utils";
import type { PreActionNudge as PreActionNudgeType } from "@/types";

interface PreActionNudgeProps {
  nudge: PreActionNudgeType;
  activityLabel: string;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PreActionNudge({
  nudge,
  activityLabel,
  open,
  onConfirm,
  onCancel,
}: PreActionNudgeProps) {
  const isHighImpact = nudge.carbonKg > 3;
  const isZero = nudge.carbonKg === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        className="max-w-sm rounded-2xl"
        aria-labelledby="nudge-title"
        aria-describedby="nudge-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" aria-hidden="true">
              {isZero ? "🌱" : isHighImpact ? "⚠️" : "ℹ️"}
            </span>
            <DialogTitle id="nudge-title" className="text-base">
              Before you confirm…
            </DialogTitle>
          </div>
          <DialogDescription id="nudge-desc" className="sr-only">
            Carbon impact preview for {activityLabel}
          </DialogDescription>
        </DialogHeader>

        {/* Activity being logged */}
        <div className="rounded-xl bg-muted px-4 py-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Logging
          </p>
          <p className="font-semibold text-foreground">{activityLabel}</p>
        </div>

        {/* Carbon impact headline */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={`rounded-xl p-4 text-center ${
            isZero
              ? "bg-eco-50 border border-eco-200"
              : isHighImpact
                ? "bg-red-50 border border-red-200"
                : "bg-amber-50 border border-amber-200"
          }`}
          aria-live="polite"
        >
          <p
            className={`text-3xl font-bold ${
              isZero ? "text-eco-700" : isHighImpact ? "text-red-600" : "text-amber-700"
            }`}
          >
            {formatCarbonKg(nudge.carbonKg)}
          </p>
          {!isZero && (
            <p className="text-xs text-muted-foreground mt-1">carbon footprint</p>
          )}
        </motion.div>

        {/* Relatable equivalents */}
        {!isZero && (
          <div className="space-y-2" aria-label="Carbon impact in relatable terms">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              That&apos;s equivalent to…
            </p>
            <ul className="space-y-1.5">
              {nudge.equivalents.map((eq) => (
                <li
                  key={eq.label}
                  className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="text-xl w-7 shrink-0 text-center" aria-hidden="true">
                    {eq.icon}
                  </span>
                  <span className="text-sm">
                    <span className="font-semibold">
                      {eq.value.toLocaleString("en-IN")} {eq.unit}
                    </span>{" "}
                    <span className="text-muted-foreground">{eq.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Context message */}
        <div className="rounded-xl bg-warm-100 px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed">{nudge.contextMessage}</p>
        </div>

        {/* Alternative suggestion */}
        {nudge.alternativeSuggestion && nudge.alternativeSavingKg !== undefined && (
          <div className="flex items-start gap-2 rounded-xl border border-eco-200 bg-eco-50 px-4 py-3">
            <span className="text-eco-600 mt-0.5 shrink-0" aria-hidden="true">💡</span>
            <div>
              <p className="text-sm font-medium text-eco-800">{nudge.alternativeSuggestion}</p>
              <p className="text-xs text-eco-600 mt-0.5">
                saves ~{formatCarbonKg(nudge.alternativeSavingKg)}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Go back
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
            aria-label={`Confirm logging ${activityLabel}`}
          >
            Log it anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

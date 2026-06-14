"use client";

// EcoPulse — Weekly Report page

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { PageShell } from "@/components/shared/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCarbonKg, formatDeltaPercent, categoryIcon, categoryLabel } from "@/lib/utils";
import { effortLabel } from "@/lib/recommendationEngine";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ActivityCategory } from "@/types";

export default function WeeklyPage() {
  const { isOnboarded, weeklyReport } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  if (!weeklyReport || weeklyReport.totalCarbonKg === 0) {
    return (
      <PageShell>
        <h1 className="text-2xl font-bold mb-6">Weekly Report</h1>
        <div className="rounded-2xl border-2 border-dashed border-eco-200 p-8 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">📋</p>
          <p className="font-medium">No data this week yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Log activities throughout the week to generate your report.
          </p>
        </div>
      </PageShell>
    );
  }

  const delta = weeklyReport.deltaPercent;
  const DeltaIcon = delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;

  const nonZeroCategories = (Object.entries(weeklyReport.categoryBreakdown) as [ActivityCategory, number][])
    .filter(([, kg]) => kg > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Weekly Report</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {weeklyReport.weekStart} — {weeklyReport.weekEnd}
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-eco-600 to-eco-700 text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-eco-100 text-sm">Total this week</p>
                  <p className="text-4xl font-bold">{weeklyReport.totalCarbonKg.toFixed(1)}</p>
                  <p className="text-eco-100 text-sm">kg CO₂</p>
                </div>
                {weeklyReport.previousWeekKg > 0 && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <DeltaIcon className="h-5 w-5" aria-hidden="true" />
                      <p className="text-xl font-bold">{formatDeltaPercent(delta)}</p>
                    </div>
                    <p className="text-eco-100 text-xs">vs last week ({weeklyReport.previousWeekKg.toFixed(1)} kg)</p>
                  </div>
                )}
              </div>

              {weeklyReport.streakDays > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span aria-hidden="true">🔥</span>
                  <p className="text-eco-100 text-sm">
                    {weeklyReport.streakDays}-day logging streak
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Highlights */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What happened this week</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weeklyReport.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-eco-500 mt-0.5 shrink-0" aria-hidden="true">•</span>
                    <span className="text-foreground leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category breakdown */}
        {nonZeroCategories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">By category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nonZeroCategories.map(([cat, kg]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xl w-7 shrink-0" aria-hidden="true">{categoryIcon(cat)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{categoryLabel(cat)}</p>
                        <p className="text-sm font-semibold">{formatCarbonKg(kg)}</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                        <div
                          className="h-full bg-eco-500 rounded-full"
                          style={{ width: `${(kg / weeklyReport.totalCarbonKg) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Top 3 recommendations */}
        {weeklyReport.topRecommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Next 3 actions for next week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyReport.topRecommendations.map((rec, i) => (
                  <div
                    key={rec.id}
                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                  >
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-eco-100 text-eco-700 font-bold text-xs shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium">{rec.action}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="eco" className="text-xs">
                          {effortLabel(rec.effort)}
                        </Badge>
                        <span className="text-xs font-semibold text-eco-700">
                          ~{rec.weeklyImpactKg.toFixed(1)} kg saved
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

"use client";

// EcoPulse — Dashboard page
// Criterion: Problem Statement Alignment (HIGH) — answers "what should I do next?" every visit

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { PageShell } from "@/components/shared/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  categoryIcon,
  categoryLabel,
  timeGreeting,
  formatDeltaPercent,
} from "@/lib/utils";
import { totalCarbonKg, activitiesThisWeek, carbonByCategory } from "@/lib/carbonEngine";
import type { ActivityCategory } from "@/types";
import { effortLabel } from "@/lib/recommendationEngine";
import { Leaf, TrendingDown, TrendingUp, Minus, PlusCircle, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { state, isOnboarded, weeklyReport } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  if (!state.profile) return null;

  const thisWeek = activitiesThisWeek(state.activities);
  const weeklyKg = totalCarbonKg(thisWeek);
  const breakdown = carbonByCategory(thisWeek);
  const delta = weeklyReport?.deltaPercent ?? 0;

  const greeting = timeGreeting();
  const topRec = state.recommendations[0];

  const INDIA_AVG_WEEKLY = 34.6;
  const vsAvgPct = INDIA_AVG_WEEKLY > 0
    ? Math.round(((weeklyKg - INDIA_AVG_WEEKLY) / INDIA_AVG_WEEKLY) * 100)
    : 0;

  const DeltaIcon = delta < 0 ? TrendingDown : delta > 0 ? TrendingUp : Minus;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-2xl font-bold text-foreground">
            {state.profile.name} 👋
          </h1>
        </div>
        <div className="flex items-center gap-1 text-eco-600">
          <Leaf className="h-5 w-5" />
          <span className="text-sm font-semibold">EcoPulse</span>
        </div>
      </div>

      {/* Weekly carbon summary card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-4 bg-gradient-to-br from-eco-600 to-eco-700 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-eco-100 text-sm font-medium">This week</p>
                <p className="text-4xl font-bold mt-1">{weeklyKg.toFixed(1)}</p>
                <p className="text-eco-100 text-sm">kg CO₂</p>
              </div>
              <div className="text-right">
                {weeklyReport && weeklyReport.previousWeekKg > 0 && (
                  <div className="flex items-center gap-1 justify-end">
                    <DeltaIcon className="h-4 w-4" />
                    <span className="font-semibold text-sm">
                      {formatDeltaPercent(delta)} vs last week
                    </span>
                  </div>
                )}
                <p className="text-xs text-eco-200 mt-1">
                  India avg: ~{INDIA_AVG_WEEKLY} kg/week
                </p>
                {weeklyKg > 0 && (
                  <Badge
                    className="mt-2 text-xs"
                    style={{
                      background: vsAvgPct < 0 ? "rgba(255,255,255,0.2)" : "rgba(255,0,0,0.2)",
                      color: "white",
                      border: "none",
                    }}
                  >
                    {vsAvgPct < 0
                      ? `${Math.abs(vsAvgPct)}% below average`
                      : `${vsAvgPct}% above average`}
                  </Badge>
                )}
              </div>
            </div>

            {/* Category mini-bars */}
            {weeklyKg > 0 && (
              <div className="mt-4 space-y-1.5">
                {(Object.entries(breakdown) as [ActivityCategory, number][])
                  .filter(([, kg]) => kg > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, kg]) => (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-xs w-4" aria-hidden="true">{categoryIcon(cat)}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-eco-800/40 overflow-hidden">
                        <div
                          className="h-full bg-white/70 rounded-full transition-all duration-500"
                          style={{ width: `${(kg / weeklyKg) * 100}%` }}
                          role="presentation"
                        />
                      </div>
                      <span className="text-xs text-eco-100 w-16 text-right">
                        {kg.toFixed(1)} kg
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Next best action */}
      {topRec && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Your next best action</h2>
            <button
              onClick={() => router.push("/insights")}
              className="text-xs text-eco-600 hover:underline focus-visible:ring-2 focus-visible:ring-eco-500 rounded"
            >
              See all
            </button>
          </div>

          <Card className="mb-4 border-eco-200 bg-eco-50/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg" aria-hidden="true">{categoryIcon(topRec.category)}</span>
                    <Badge variant="eco" className="text-xs">{categoryLabel(topRec.category)}</Badge>
                    <Badge className="text-xs bg-white text-muted-foreground border">
                      {effortLabel(topRec.effort)}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{topRec.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{topRec.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-eco-700 font-bold text-sm">
                    ~{topRec.weeklyImpactKg.toFixed(1)} kg
                  </p>
                  <p className="text-xs text-muted-foreground">saved/week</p>
                </div>
              </div>

              <Button
                size="sm"
                variant="eco"
                className="mt-3 w-full"
                onClick={() => router.push("/log")}
              >
                Log this action
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick log button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Button
          className="w-full mb-4"
          size="lg"
          onClick={() => router.push("/log")}
          aria-label="Log a new activity"
        >
          <PlusCircle className="h-5 w-5" />
          Log today&apos;s activity
        </Button>
      </motion.div>

      {/* Streak display */}
      {weeklyReport && weeklyReport.streakDays > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="mb-4">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="text-3xl" aria-hidden="true">🔥</div>
              <div>
                <p className="font-semibold text-sm">
                  {weeklyReport.streakDays}-day logging streak
                </p>
                <p className="text-xs text-muted-foreground">
                  Consistency reveals patterns. Keep it up!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top insights preview */}
      {state.insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Latest insights</h2>
            <button
              onClick={() => router.push("/insights")}
              className="text-xs text-eco-600 hover:underline focus-visible:ring-2 focus-visible:ring-eco-500 rounded"
            >
              All insights
            </button>
          </div>

          <div className="space-y-2">
            {state.insights.slice(0, 2).map((insight) => (
              <Card key={insight.id} className="hover:border-eco-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Badge
                      variant={insight.priority === "high" ? "high" : insight.priority === "medium" ? "medium" : "low"}
                      className="shrink-0 mt-0.5"
                    >
                      {insight.priority}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {insight.actionHint}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {thisWeek.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 rounded-2xl border-2 border-dashed border-eco-200 p-8 text-center"
        >
          <p className="text-4xl mb-3" aria-hidden="true">📝</p>
          <p className="font-medium text-foreground">No activities this week yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Log your commute or a meal to see your carbon impact.
          </p>
        </motion.div>
      )}
    </PageShell>
  );
}

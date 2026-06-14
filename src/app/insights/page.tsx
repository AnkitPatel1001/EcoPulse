"use client";

// EcoPulse — Insights page
// Criterion: Problem Statement Alignment (HIGH) — "understand" pillar; explains patterns not numbers

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { PageShell } from "@/components/shared/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { effortLabel } from "@/lib/recommendationEngine";
import { categoryIcon, categoryLabel } from "@/lib/utils";
import type { Insight, Recommendation } from "@/types";

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const priorityVariant = insight.priority === "high" ? "high" : insight.priority === "medium" ? "medium" : "low";
  const categoryEmoji =
    insight.category === "overall" ? "📊" : categoryIcon(insight.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <Card
        className={`border-l-4 ${
          insight.priority === "high"
            ? "border-l-red-400"
            : insight.priority === "medium"
              ? "border-l-amber-400"
              : "border-l-eco-400"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">
              {categoryEmoji}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant={priorityVariant} className="capitalize text-xs">
                  {insight.priority} priority
                </Badge>
                {insight.category !== "overall" && (
                  <Badge variant="outline" className="text-xs">
                    {categoryLabel(insight.category)}
                  </Badge>
                )}
                {insight.source === "ai" && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                    AI insight
                  </Badge>
                )}
              </div>

              <h3 className="font-semibold text-sm text-foreground leading-snug">
                {insight.title}
              </h3>

              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {insight.body}
              </p>

              <div className="mt-3 flex items-start gap-2 rounded-lg bg-eco-50 px-3 py-2">
                <span className="text-eco-600 text-sm shrink-0" aria-hidden="true">→</span>
                <p className="text-sm text-eco-800 font-medium">{insight.actionHint}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const effortColors: Record<number, string> = {
    1: "bg-green-100 text-green-700",
    2: "bg-eco-100 text-eco-700",
    3: "bg-amber-100 text-amber-700",
    4: "bg-orange-100 text-orange-700",
    5: "bg-red-100 text-red-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.06, duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0" aria-hidden="true">
              {categoryIcon(rec.category)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    effortColors[rec.effort] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {effortLabel(rec.effort)}
                </span>
              </div>

              <p className="font-semibold text-sm">{rec.action}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>

              <div className="mt-2 flex items-center gap-1">
                <span className="text-eco-600 font-bold text-sm">
                  ~{rec.weeklyImpactKg.toFixed(1)} kg CO₂
                </span>
                <span className="text-xs text-muted-foreground">saved per week</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function InsightsPage() {
  const { state, isOnboarded } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  const hasData = state.activities.length > 0;

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Understanding your patterns is the first step to changing them.
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-2xl border-2 border-dashed border-eco-200 p-8 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">💡</p>
          <p className="font-medium">No data yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Log a few activities to unlock personalized insights about your carbon patterns.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Insights */}
          <section aria-labelledby="insights-heading">
            <h2 id="insights-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Pattern insights
            </h2>
            <div className="space-y-3">
              {state.insights.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </div>
          </section>

          {/* Recommendations */}
          {state.recommendations.length > 0 && (
            <section aria-labelledby="recs-heading">
              <h2 id="recs-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Actions ranked by impact ÷ effort
              </h2>
              <div className="space-y-3">
                {state.recommendations.map((rec, i) => (
                  <RecommendationCard key={rec.id} rec={rec} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

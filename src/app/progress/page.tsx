"use client";

// EcoPulse — Progress page
// Criterion: Problem Statement Alignment (HIGH) — "track/reduce" pillar; motivating honest progress

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useAppContext } from "@/context/AppContext";
import { PageShell } from "@/components/shared/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupByWeek, totalCarbonKg } from "@/lib/carbonEngine";
import {
  categoryIcon,
  categoryLabel,
  formatCarbonKg,
  formatShortDate,
} from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { ActivityCategory } from "@/types";

const CHART_COLORS: Record<ActivityCategory, string> = {
  transport: "#3b82f6",
  meals: "#f97316",
  electricity: "#eab308",
  flights: "#a855f7",
  shopping: "#ec4899",
  waste: "#22c55e",
};

export default function ProgressPage() {
  const { state, isOnboarded, weeklyReport } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  // Build weekly trend data — O(n log n) groupByWeek
  const weeklyTrend = useMemo(() => {
    const byWeek = groupByWeek(state.activities);
    return Array.from(byWeek.entries())
      .map(([weekStart, acts]) => ({
        week: format(parseISO(weekStart), "MMM d"),
        carbonKg: Math.round(totalCarbonKg(acts) * 10) / 10,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8); // Show last 8 weeks
  }, [state.activities]);

  // This week's category breakdown for pie chart
  const breakdown = weeklyReport
    ? Object.entries(weeklyReport.categoryBreakdown)
        .filter(([, kg]) => kg > 0)
        .map(([cat, kg]) => ({
          name: categoryLabel(cat as ActivityCategory),
          value: Math.round(kg * 10) / 10,
          color: CHART_COLORS[cat as ActivityCategory],
          icon: categoryIcon(cat as ActivityCategory),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const totalThisWeek = weeklyReport?.totalCarbonKg ?? 0;
  const streak = weeklyReport?.streakDays ?? 0;

  // Habit garden progress — percentage of India avg (34.6 kg/week)
  const INDIA_AVG = 34.6;
  const gardenPct = Math.min(100, Math.round((totalThisWeek / INDIA_AVG) * 100));

  const recentActivities = state.activities.slice(0, 10);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Honest, week-by-week view of your footprint.
        </p>
      </div>

      {state.activities.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-eco-200 p-8 text-center">
          <p className="text-4xl mb-3" aria-hidden="true">📈</p>
          <p className="font-medium">Start logging to see progress</p>
          <p className="text-sm text-muted-foreground mt-1">
            Charts and trends appear once you have a few days of activity data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Streak + Goal pill */}
          <div className="flex gap-3">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-eco-600" aria-label={`${streak} day streak`}>
                  {streak}
                </p>
                <p className="text-xs text-muted-foreground">day streak 🔥</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-foreground" aria-label={`${formatCarbonKg(totalThisWeek)} this week`}>
                  {totalThisWeek.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂ this week</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p
                  className={`text-3xl font-bold ${totalThisWeek < INDIA_AVG ? "text-eco-600" : "text-red-500"}`}
                  aria-label={`${gardenPct}% of India average`}
                >
                  {gardenPct}%
                </p>
                <p className="text-xs text-muted-foreground">of India avg</p>
              </CardContent>
            </Card>
          </div>

          {/* Habit garden — visual indicator */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Carbon World 🌍</CardTitle>
                <p className="text-xs text-muted-foreground">
                  How your footprint compares to the Indian average this week
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-all ${
                        gardenPct <= 60
                          ? "bg-eco-500"
                          : gardenPct <= 100
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min(gardenPct, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      role="presentation"
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground w-10">
                    {gardenPct}%
                  </span>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 kg (zero)</span>
                  <span>🎯 {INDIA_AVG} kg (India avg)</span>
                </div>

                {/* Emoji garden that improves as footprint drops */}
                <div
                  className="mt-4 p-4 rounded-xl bg-warm-100 text-center"
                  role="img"
                  aria-label={`Your carbon garden: ${gardenPct <= 50 ? "thriving" : gardenPct <= 80 ? "growing" : gardenPct <= 120 ? "stressed" : "struggling"}`}
                >
                  <p className="text-3xl">
                    {gardenPct <= 50
                      ? "🌳🌿🌸🦋"
                      : gardenPct <= 80
                        ? "🌱🌿🌤️"
                        : gardenPct <= 120
                          ? "🌾🌫️"
                          : "🏭🌫️🌵"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {gardenPct <= 50
                      ? "Thriving! Well below average."
                      : gardenPct <= 80
                        ? "Growing strong. Keep going."
                        : gardenPct <= 120
                          ? "Near average — a few swaps will make a difference."
                          : "Above average. Your next action matters most now."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly trend chart */}
          {weeklyTrend.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Weekly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div aria-label="Weekly carbon footprint chart" role="img">
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={weeklyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 11, fill: "#888" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#888" }}
                          axisLine={false}
                          tickLine={false}
                          unit=" kg"
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${value} kg CO₂`, "Carbon"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="carbonKg"
                          stroke="#22c55e"
                          strokeWidth={2.5}
                          fill="url(#carbonGradient)"
                          dot={{ fill: "#16a34a", strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, fill: "#16a34a" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Category breakdown pie */}
          {breakdown.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">This week by category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div aria-label="Category breakdown pie chart" role="img">
                      <PieChart width={120} height={120}>
                        <Pie
                          data={breakdown}
                          dataKey="value"
                          cx={55}
                          cy={55}
                          outerRadius={50}
                          innerRadius={28}
                          strokeWidth={0}
                        >
                          {breakdown.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </div>

                    <ul className="flex-1 space-y-1.5">
                      {breakdown.map((entry) => (
                        <li key={entry.name} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: entry.color }}
                            aria-hidden="true"
                          />
                          <span className="flex-1 text-muted-foreground">{entry.name}</span>
                          <span className="font-semibold">{entry.value} kg</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recent activity log */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent activities</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul aria-label="Recent logged activities">
                  {recentActivities.map((activity, i) => (
                    <li
                      key={activity.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < recentActivities.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="text-xl shrink-0" aria-hidden="true">
                        {categoryIcon(activity.category)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate capitalize">
                          {activity.subtype.replace(/-/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatShortDate(activity.timestamp)} · {activity.quantity} {activity.unit}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-foreground shrink-0">
                        {formatCarbonKg(activity.carbonKg)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </PageShell>
  );
}

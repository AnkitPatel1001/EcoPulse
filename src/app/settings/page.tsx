"use client";

// EcoPulse — Settings & methodology page
// Criterion: Problem Statement Alignment — transparent assumptions, honest methodology

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { PageShell } from "@/components/shared/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ALL_FACTORS, INDIA_GRID_FACTOR_KG_PER_KWH } from "@/lib/emissionFactors";
import { exportDataAsJson } from "@/lib/storage";
import type { ActivityCategory } from "@/types";

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  transport: "Transport",
  meals: "Meals & Food",
  electricity: "Electricity",
  flights: "Flights",
  shopping: "Shopping",
  waste: "Waste",
};

export default function SettingsPage() {
  const { state, isOnboarded, resetAll } = useAppContext();
  const router = useRouter();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, router]);

  const handleExport = () => {
    const json = exportDataAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecopulse-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetAll();
    router.replace("/onboarding");
  };

  if (!state.profile) return null;

  const factorsByCategory: Record<ActivityCategory, typeof ALL_FACTORS> = {
    transport: ALL_FACTORS.filter((f) => f.category === "transport"),
    meals: ALL_FACTORS.filter((f) => f.category === "meals"),
    electricity: ALL_FACTORS.filter((f) => f.category === "electricity"),
    flights: ALL_FACTORS.filter((f) => f.category === "flights"),
    shopping: ALL_FACTORS.filter((f) => f.category === "shopping"),
    waste: ALL_FACTORS.filter((f) => f.category === "waste"),
  };

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your profile, data, and the assumptions behind your numbers.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{state.profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">City</span>
              <span className="font-medium">{state.profile.city}, {state.profile.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commute</span>
              <span className="font-medium">{state.profile.commuteStyle} · {state.profile.commuteDistanceKm} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diet</span>
              <span className="font-medium capitalize">{state.profile.dietPattern.replace(/-/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Household</span>
              <span className="font-medium">{state.profile.householdSize} person(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activities logged</span>
              <span className="font-medium">{state.activities.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              All data is stored locally in your browser. EcoPulse never sends personal data to any server.
            </p>
            <Button variant="outline" className="w-full" onClick={handleExport}>
              Export data as JSON
            </Button>
            {!showConfirmReset ? (
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/5"
                onClick={() => setShowConfirmReset(true)}
              >
                Reset all data
              </Button>
            ) : (
              <div className="rounded-xl border border-destructive bg-destructive/5 p-4 space-y-3">
                <p className="text-sm text-destructive font-medium">
                  Are you sure? This will permanently delete all your activities, profile, and insights.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReset}
                  >
                    Yes, reset everything
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Methodology */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Our Methodology</CardTitle>
              <button
                onClick={() => setShowMethodology((s) => !s)}
                className="text-xs text-eco-600 hover:underline focus-visible:ring-2 focus-visible:ring-eco-500 rounded"
                aria-expanded={showMethodology}
              >
                {showMethodology ? "Hide" : "Show"} details
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-800 font-medium mb-1">Transparency note</p>
              <p className="text-xs text-amber-700">
                Emission factors are approximations based on publicly available data. Personal
                carbon calculations are inherently imprecise — the goal is awareness and direction,
                not scientific precision. When in doubt, we round up.
              </p>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• <strong>Indian grid factor:</strong> {INDIA_GRID_FACTOR_KG_PER_KWH} kg CO₂/kWh (CEA 2023)</p>
              <p>• <strong>Reference car:</strong> 0.21 kg CO₂/km (petrol, India avg 14 km/L)</p>
              <p>• <strong>Tree absorption:</strong> ~21 kg CO₂/year ≈ 0.058 kg/day</p>
              <p>• <strong>India avg footprint:</strong> ~1.8 t CO₂/year ≈ 34.6 kg/week</p>
              <p>• <strong>Global avg:</strong> ~7.5 t CO₂/year ≈ 144 kg/week</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Sources: IPCC AR6 (2022), IEA India Energy Outlook 2023, CPCB India 2022,
              Poore & Nemecek 2018, DEFRA 2023, BEE India.
            </p>

            {showMethodology && (
              <div className="space-y-4 mt-2">
                <Separator />
                {(Object.entries(factorsByCategory) as [ActivityCategory, typeof ALL_FACTORS][]).map(
                  ([cat, factors]) => (
                    <div key={cat}>
                      <h3 className="font-semibold text-sm mb-2">{CATEGORY_LABELS[cat]}</h3>
                      <div className="space-y-2">
                        {factors.map((f) => (
                          <div key={f.id} className="rounded-lg bg-muted/50 px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-xs">{f.label}</span>
                              <Badge variant="outline" className="text-xs font-mono">
                                {f.factor} kg/{f.unit}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                            <p className="text-xs text-muted-foreground italic">Source: {f.source}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl mb-2" aria-hidden="true">🌿</p>
              <p className="font-bold text-sm">EcoPulse v0.1.0</p>
              <p className="text-xs text-muted-foreground mt-1">
                Personal carbon-awareness coach for Indian urban professionals.
                Built for PromptWars Virtual — Challenge 3.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                All calculations run locally in your browser. No tracking. No ads.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

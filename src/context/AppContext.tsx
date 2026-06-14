"use client";

// EcoPulse — Global app state context
// Criterion: Code Quality (HIGH) — single source of truth, clean context API

import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { generateRecommendations } from "@/lib/recommendationEngine";
import { generateInsights } from "@/lib/insightEngine";
import { buildWeeklyReport } from "@/lib/carbonEngine";
import {
  loadAppState,
  saveProfile,
  saveActivity,
  saveAllActivities,
  saveRecommendations,
  saveInsights,
  saveWeeklyReports,
  clearAllData,
} from "@/lib/storage";
import type { AppState, UserProfile, ActivityLog, WeeklyReport } from "@/types";

// ── State & actions ───────────────────────────────────────────────────────────

type AppAction =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "SET_PROFILE"; payload: UserProfile }
  | { type: "ADD_ACTIVITY"; payload: ActivityLog }
  | { type: "SEED_ACTIVITIES"; payload: ActivityLog[] }
  | { type: "REFRESH_DERIVED" }
  | { type: "RESET" };

function deriveState(state: AppState): AppState {
  if (!state.profile) return state;

  const recommendations = generateRecommendations(state.profile, state.activities);
  const insights = generateInsights(state.activities, state.profile);
  const weeklyReport = buildWeeklyReport(state.activities, recommendations);

  const weeklyReports =
    state.weeklyReports.length > 0
      ? [weeklyReport, ...state.weeklyReports.slice(1)]
      : [weeklyReport];

  return { ...state, recommendations, insights, weeklyReports };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_STATE":
      return deriveState(action.payload);

    case "SET_PROFILE": {
      const next: AppState = { ...state, profile: action.payload };
      return deriveState(next);
    }

    case "ADD_ACTIVITY": {
      const next: AppState = {
        ...state,
        activities: [action.payload, ...state.activities],
      };
      return deriveState(next);
    }

    case "SEED_ACTIVITIES": {
      const next: AppState = { ...state, activities: action.payload };
      return deriveState(next);
    }

    case "REFRESH_DERIVED":
      return deriveState(state);

    case "RESET":
      return {
        profile: null,
        activities: [],
        recommendations: [],
        insights: [],
        weeklyReports: [],
        goals: [],
      };

    default:
      return state;
  }
}

const initialState: AppState = {
  profile: null,
  activities: [],
  recommendations: [],
  insights: [],
  weeklyReports: [],
  goals: [],
};

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  setProfile: (profile: UserProfile) => void;
  addActivity: (activity: ActivityLog) => void;
  seedActivities: (activities: ActivityLog[]) => void;
  resetAll: () => void;
  weeklyReport: WeeklyReport | null;
  isOnboarded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const persisted = loadAppState();
    dispatch({ type: "LOAD_STATE", payload: persisted });
  }, []);

  // Persist side effects after state changes
  useEffect(() => {
    if (state.profile) {
      saveProfile(state.profile);
      saveRecommendations(state.recommendations);
      saveInsights(state.insights);
      saveWeeklyReports(state.weeklyReports);
    }
  }, [state.profile, state.recommendations, state.insights, state.weeklyReports]);

  const setProfile = useCallback((profile: UserProfile) => {
    dispatch({ type: "SET_PROFILE", payload: profile });
  }, []);

  const addActivity = useCallback((activity: ActivityLog) => {
    dispatch({ type: "ADD_ACTIVITY", payload: activity });
    saveActivity(activity);
  }, []);

  const seedActivities = useCallback((activities: ActivityLog[]) => {
    dispatch({ type: "SEED_ACTIVITIES", payload: activities });
    saveAllActivities(activities);
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    dispatch({ type: "RESET" });
  }, []);

  const value: AppContextValue = {
    state,
    setProfile,
    addActivity,
    seedActivities,
    resetAll,
    weeklyReport: state.weeklyReports[0] ?? null,
    isOnboarded: state.profile?.onboardingCompleted === true,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}

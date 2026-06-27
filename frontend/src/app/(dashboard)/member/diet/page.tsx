"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Apple,
  Loader,
  AlertTriangle,
  Flame,
  GlassWater,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import { pageTransition } from "@/lib/animations";

interface DietPlan {
  id: string;
  title: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string | null;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWaterMl: number;
  trainer?: {
    name: string;
  } | null;
}

interface LoggedConsumed {
  calories: number;
  protein: number;
  water: number;
}

interface LoggedTarget {
  calories: number;
  protein: number;
  water: number;
}

interface DailySummary {
  target: LoggedTarget;
  consumed: LoggedConsumed;
}

export const tapScaling = {
  whileHover: { scale: 1.05, boxShadow: "0 0 15px rgba(34,211,238,0.4)" },
  whileTap: { scale: 0.95 },
};

function ProgressRing({
  percent,
  label,
  value,
  target,
  unit,
  color,
}: {
  percent: number;
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(percent, 100);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex-1 min-w-[120px] text-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-extrabold text-white font-inter">{Math.round(percent)}%</span>
        </div>
      </div>
      <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-3">
        {label}
      </span>
      <span className="text-white font-extrabold text-xs mt-1 font-inter">
        {value} / {target} <span className="text-[10px] text-white/40 font-normal">{unit}</span>
      </span>
    </div>
  );
}

export default function MemberDietPage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accordion active sections
  const [activeAccordion, setActiveAccordion] = useState<string | null>("Breakfast");

  // Logging Form states
  const [mealCalories, setMealCalories] = useState<Record<string, string>>({
    Breakfast: "",
    Lunch: "",
    Dinner: "",
    Snacks: "",
  });
  const [mealProtein, setMealProtein] = useState<Record<string, string>>({
    Breakfast: "",
    Lunch: "",
    Dinner: "",
    Snacks: "",
  });

  const [loggingMeal, setLoggingMeal] = useState<string | null>(null);
  const [isWaterLogging, setIsWaterLogging] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const loadDietDetails = useCallback(async () => {
    try {
      setLoading(true);
      const meResponse = await api.get("/api/auth/me");
      const profile = meResponse.data.memberProfile;
      if (!profile) {
        setError("No member profile associated with this account.");
        setLoading(false);
        return;
      }
      setMemberId(profile.id);

      const dateStr = getTodayString();

      const [planRes, summaryRes] = await Promise.all([
        api.get(`/api/fitness/diets?memberId=${profile.id}`),
        api.get(`/api/fitness/diet-logs/today?memberId=${profile.id}&date=${dateStr}`),
      ]);

      setDietPlan(planRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to load diet details:", err);
      setError("Could not load your daily nutrition profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDietDetails();
  }, [loadDietDetails]);

  // Log meals consumed
  const handleLogMeal = async (mealType: string) => {
    if (!memberId || !dietPlan) return;

    const calories = parseFloat(mealCalories[mealType] || "0");
    const protein = parseFloat(mealProtein[mealType] || "0");

    if (calories < 0 || protein < 0) {
      setFeedbackMsg("Calories and protein logs cannot be negative values.");
      return;
    }

    setLoggingMeal(mealType);
    setFeedbackMsg("");

    try {
      const res = await api.post("/api/fitness/diet-logs", {
        memberId,
        dietPlanId: dietPlan.id,
        waterIntakeMl: 0,
        caloriesLog: calories,
        proteinLog: protein,
      });

      // Clear input fields
      setMealCalories((prev) => ({ ...prev, [mealType]: "" }));
      setMealProtein((prev) => ({ ...prev, [mealType]: "" }));

      // Refresh data
      const dateStr = getTodayString();
      const summaryRes = await api.get(
        `/api/fitness/diet-logs/today?memberId=${memberId}&date=${dateStr}`
      );
      setSummary(summaryRes.data);

      setFeedbackMsg(`Successfully logged ${mealType}!`);
      setTimeout(() => setFeedbackMsg(""), 3000);
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error || "Failed to save nutrition details.");
    } finally {
      setLoggingMeal(null);
    }
  };

  // Log water intake
  const handleLogWater = async (amountMl: number) => {
    if (!memberId || !dietPlan) return;
    setIsWaterLogging(true);
    setFeedbackMsg("");

    try {
      await api.post("/api/fitness/diet-logs", {
        memberId,
        dietPlanId: dietPlan.id,
        waterIntakeMl: amountMl,
        caloriesLog: 0,
        proteinLog: 0,
      });

      // Refresh summary details
      const dateStr = getTodayString();
      const summaryRes = await api.get(
        `/api/fitness/diet-logs/today?memberId=${memberId}&date=${dateStr}`
      );
      setSummary(summaryRes.data);
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error || "Failed to log hydration amount.");
    } finally {
      setIsWaterLogging(false);
    }
  };

  // Fallback defaults
  const target = useMemo(() => {
    return {
      calories: summary?.target?.calories || 2000,
      protein: summary?.target?.protein || 100,
      water: summary?.target?.water || 3000,
    };
  }, [summary]);

  const consumed = useMemo(() => {
    return {
      calories: summary?.consumed?.calories || 0,
      protein: summary?.consumed?.protein || 0,
      water: summary?.consumed?.water || 0,
    };
  }, [summary]);

  const macrosPercent = useMemo(() => {
    return {
      calories: target.calories > 0 ? (consumed.calories / target.calories) * 100 : 0,
      protein: target.protein > 0 ? (consumed.protein / target.protein) * 100 : 0,
      water: target.water > 0 ? (consumed.water / target.water) * 100 : 0,
    };
  }, [target, consumed]);

  const fluidPercent = useMemo(() => {
    if (target.water === 0) return 0;
    return Math.min((consumed.water / target.water) * 100, 150);
  }, [target, consumed]);

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name);
  };

  const mealAccordions = [
    { name: "Breakfast", text: dietPlan?.breakfast },
    { name: "Lunch", text: dietPlan?.lunch },
    { name: "Snacks", text: dietPlan?.snacks },
    { name: "Dinner", text: dietPlan?.dinner },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Diet & <span className="gradient-text">Nutrition</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Monitor macronutrients, review diet schedules, and log daily hydration intakes.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader className="h-8 w-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-medium">Loading diet logs today...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center max-w-md mx-auto rounded-2xl border border-white/5">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Missing Diet Plan Lockout Warning */}
          {!dietPlan && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
              <span>
                Your trainer has not assigned a diet plan yet. Ask your trainer to assign a diet plan to log daily food and water logs.
              </span>
            </div>
          )}

          {/* Quick Metrics Rings Row */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <ProgressRing
              percent={macrosPercent.calories}
              label="Calories Logged"
              value={consumed.calories}
              target={target.calories}
              unit="kcal"
              color="rgb(139, 92, 246)"
            />
            <ProgressRing
              percent={macrosPercent.protein}
              label="Protein Intake"
              value={consumed.protein}
              target={target.protein}
              unit="g"
              color="rgb(6, 182, 212)"
            />
            <ProgressRing
              percent={macrosPercent.water}
              label="Water Logged"
              value={consumed.water}
              target={target.water}
              unit="ml"
              color="rgb(59, 130, 246)"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Meal Accodions logger (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-panel p-5 rounded-2xl border border-white/5">
                <h3 className="text-base font-bold flex items-center gap-2 mb-3">
                  <Apple className="w-4 h-4 text-violet-400" />
                  <span>Meal Schedule & Logging</span>
                </h3>
                <p className="text-xs text-white/40 mb-4">
                  Log your calorie and protein ingestion details per meal.
                </p>

                {feedbackMsg && (
                  <div className={`p-3 rounded-lg text-xs font-semibold mb-4 border ${
                    feedbackMsg.includes("Successfully")
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}>
                    {feedbackMsg}
                  </div>
                )}

                <div className="space-y-3">
                  {mealAccordions.map((meal) => {
                    const isOpen = activeAccordion === meal.name;
                    return (
                      <div
                        key={meal.name}
                        className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.01]"
                      >
                        {/* Header click */}
                        <button
                          onClick={() => toggleAccordion(meal.name)}
                          className="w-full px-5 py-4 flex justify-between items-center text-sm font-bold text-white hover:bg-white/[0.02] transition-all cursor-pointer"
                        >
                          <span>{meal.name}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-white/5"
                            >
                              <div className="p-5 space-y-4">
                                <div className="bg-white/5 p-4 rounded-xl text-xs text-white/70 italic leading-relaxed whitespace-pre-line font-medium border border-white/5">
                                  {meal.text || "No specific items prescribed. Eat a balanced healthy meal."}
                                </div>

                                {/* Logger inputs */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                                      Calories (kcal)
                                    </label>
                                    <input
                                      type="number"
                                      value={mealCalories[meal.name]}
                                      onChange={(e) =>
                                        setMealCalories((prev) => ({
                                          ...prev,
                                          [meal.name]: e.target.value,
                                        }))
                                      }
                                      placeholder="0"
                                      className="glass-input p-2.5 font-inter text-sm"
                                      disabled={!dietPlan || loggingMeal !== null}
                                      min="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                                      Protein (g)
                                    </label>
                                    <input
                                      type="number"
                                      value={mealProtein[meal.name]}
                                      onChange={(e) =>
                                        setMealProtein((prev) => ({
                                          ...prev,
                                          [meal.name]: e.target.value,
                                        }))
                                      }
                                      placeholder="0"
                                      className="glass-input p-2.5 font-inter text-sm"
                                      disabled={!dietPlan || loggingMeal !== null}
                                      min="0"
                                    />
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleLogMeal(meal.name)}
                                  disabled={!dietPlan || loggingMeal !== null}
                                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                                    dietPlan
                                      ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                                      : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                                  }`}
                                >
                                  {loggingMeal === meal.name ? (
                                    <>
                                      <Loader className="w-3.5 h-3.5 animate-spin" />
                                      <span>Logging...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3.5 h-3.5" />
                                      <span>Log consumed {meal.name}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SVG Animated Hydration Widget (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between items-center text-center space-y-5">
                <div>
                  <h3 className="font-bold text-base">Water Hydration Widget</h3>
                  <p className="text-xs text-white/40 mt-1">Keep updated with physical fluid logs.</p>
                </div>

                {/* Animated SVG hydration glass */}
                <div className="relative w-32 h-56 bg-zinc-950/80 border-4 border-white/10 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-700 via-cyan-500 to-cyan-400 opacity-80 transition-all duration-1000 ease-out relative"
                    style={{ height: `${fluidPercent}%` }}
                  >
                    {/* Animated bubbles or wave shape */}
                    <div className="absolute top-0 left-0 right-0 h-3 bg-white/20 blur-[1px] animate-pulse" />
                  </div>

                  {/* Centered numeric overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <span className="text-2xl font-black text-white font-inter">{consumed.water}</span>
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">ml</span>
                    <span className="text-[8px] text-white/40 uppercase tracking-widest mt-1">Logged Today</span>
                  </div>
                </div>

                {/* Quick Log Buttons */}
                <div className="grid grid-cols-3 gap-2 w-full pt-2">
                  {[
                    { label: "+250ml", amount: 250 },
                    { label: "+500ml", amount: 500 },
                    { label: "+1000ml", amount: 1000 },
                  ].map((btn) => (
                    <motion.button
                      key={btn.label}
                      {...tapScaling}
                      onClick={() => handleLogWater(btn.amount)}
                      disabled={!dietPlan || isWaterLogging}
                      className={`py-2 px-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                        dietPlan
                          ? "bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 cursor-pointer"
                          : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                      }`}
                    >
                      {btn.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

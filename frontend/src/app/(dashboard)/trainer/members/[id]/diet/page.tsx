"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Apple,
  Save,
  ArrowLeft,
  Loader,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "@/lib/api";
import { pageTransition } from "@/lib/animations";

interface Member {
  name: string;
  memberId: string;
}

const MACRO_COLORS = {
  Protein: "#8b5cf6", // Purple
  Carbs: "#06b6d4", // Cyan
  Fats: "#f59e0b", // Amber
};

export default function DietPlannerPage() {
  const { id: memberId } = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Plan parameters
  const [title, setTitle] = useState("");
  const [targetCalories, setTargetCalories] = useState("2000");
  const [targetProtein, setTargetProtein] = useState("120");
  const [targetCarbs, setTargetCarbs] = useState("200");
  const [targetFats, setTargetFats] = useState("60");
  const [targetWater, setTargetWater] = useState("3000");

  // Meal texts
  const [breakfast, setBreakfast] = useState("");
  const [lunch, setLunch] = useState("");
  const [snacks, setSnacks] = useState("");
  const [dinner, setDinner] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  const fetchDietDetails = useCallback(async () => {
    try {
      const [memberRes, dietRes] = await Promise.all([
        api.get(`/api/admin/members/${memberId}`),
        api.get(`/api/fitness/diets?memberId=${memberId}`),
      ]);
      setMember(memberRes.data);
      if (dietRes.data) {
        setTitle(dietRes.data.title);
        setTargetCalories(dietRes.data.targetCalories.toString());
        setTargetProtein(dietRes.data.targetProtein.toString());
        setTargetCarbs(dietRes.data.targetCarbs.toString());
        setTargetFats(dietRes.data.targetFats.toString());
        setTargetWater(dietRes.data.targetWaterMl.toString());
        setBreakfast(dietRes.data.breakfast);
        setLunch(dietRes.data.lunch);
        setSnacks(dietRes.data.snacks || "");
        setDinner(dietRes.data.dinner);
      } else {
        setTitle("Daily Nutrition Routine");
      }
    } catch (err) {
      console.error("Error loading diet profile:", err);
      setError("Failed to load member profile or active diet logs.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchDietDetails();
  }, [fetchDietDetails]);

  // Live calorie validation math
  const macroCalorieSum = useMemo(() => {
    const p = parseFloat(targetProtein) || 0;
    const c = parseFloat(targetCarbs) || 0;
    const f = parseFloat(targetFats) || 0;
    return p * 4 + c * 4 + f * 9;
  }, [targetProtein, targetCarbs, targetFats]);

  const macroValidation = useMemo(() => {
    const target = parseFloat(targetCalories) || 0;
    if (target === 0 || macroCalorieSum === 0) return { isValid: false, difference: 0 };
    const diff = Math.abs(macroCalorieSum - target) / target;
    return {
      isValid: diff <= 0.1, // Within ±10% range
      percentDiff: (diff * 100).toFixed(0),
    };
  }, [targetCalories, macroCalorieSum]);

  // Dynamic PieChart segments data
  const pieData = useMemo(() => {
    const p = parseFloat(targetProtein) || 0;
    const c = parseFloat(targetCarbs) || 0;
    const f = parseFloat(targetFats) || 0;
    const totalWeight = p + c + f;

    if (totalWeight === 0) {
      return [
        { name: "Protein", value: 33 },
        { name: "Carbs", value: 33 },
        { name: "Fats", value: 33 },
      ];
    }

    return [
      { name: "Protein", value: Math.round((p / totalWeight) * 100) },
      { name: "Carbs", value: Math.round((c / totalWeight) * 100) },
      { name: "Fats", value: Math.round((f / totalWeight) * 100) },
    ];
  }, [targetProtein, targetCarbs, targetFats]);

  const handleSaveDiet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormSuccess("");
    setIsSubmitting(true);

    if (!title || !breakfast || !lunch || !dinner) {
      setError("Please fill out Diet Title, Breakfast, Lunch, and Dinner inputs.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/api/fitness/diets", {
        memberId: String(memberId),
        title,
        breakfast,
        lunch,
        dinner,
        snacks: snacks || undefined,
        targetCalories: parseFloat(targetCalories),
        targetProtein: parseFloat(targetProtein),
        targetCarbs: parseFloat(targetCarbs),
        targetFats: parseFloat(targetFats),
        targetWaterMl: parseFloat(targetWater),
      });

      setFormSuccess("Diet plan assigned successfully!");
      fetchDietDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to assign diet plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-medium">Opening diet planner terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Back button */}
      <button
        onClick={() => router.push("/trainer")}
        className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 font-bold uppercase tracking-wider transition-colors hover:underline cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Diet <span className="gradient-text">Planner</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Assign client nutritional macros:{" "}
          <span className="text-white font-bold">{member?.name}</span> ({member?.memberId})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Planner parameters and macro calculations */}
        <div className="lg:col-span-8 space-y-6">
          <form
            onSubmit={handleSaveDiet}
            className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-lg">Daily Meals Breakdown</h3>
              <Apple className="h-5 w-5 text-white/40" />
            </div>

            {formSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl">
                {formSuccess}
              </div>
            )}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Diet Plan Title*
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hypertrophy Shred Meal Plan"
                className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                required
              />
            </div>

            {/* Inputs list for meals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Breakfast meals*
                  </label>
                  <span className="text-[10px] text-white/30">{breakfast.length} chars</span>
                </div>
                <textarea
                  value={breakfast}
                  onChange={(e) => setBreakfast(e.target.value)}
                  placeholder="e.g. 4 egg whites scrambled, 1 cup rolled oats with almond milk..."
                  rows={3}
                  className="glass-input w-full p-2.5 text-xs text-white focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Lunch meals*
                  </label>
                  <span className="text-[10px] text-white/30">{lunch.length} chars</span>
                </div>
                <textarea
                  value={lunch}
                  onChange={(e) => setLunch(e.target.value)}
                  placeholder="e.g. 150g grilled chicken breast, 100g brown rice, mixed green salad..."
                  rows={3}
                  className="glass-input w-full p-2.5 text-xs text-white focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Snacks (Optional)
                  </label>
                  <span className="text-[10px] text-white/30">{snacks.length} chars</span>
                </div>
                <textarea
                  value={snacks}
                  onChange={(e) => setSnacks(e.target.value)}
                  placeholder="e.g. 1 scoop whey protein isolate, 15 almonds..."
                  rows={3}
                  className="glass-input w-full p-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Dinner meals*
                  </label>
                  <span className="text-[10px] text-white/30">{dinner.length} chars</span>
                </div>
                <textarea
                  value={dinner}
                  onChange={(e) => setDinner(e.target.value)}
                  placeholder="e.g. 150g baked salmon, roasted broccoli, 1 baked sweet potato..."
                  rows={3}
                  className="glass-input w-full p-2.5 text-xs text-white focus:outline-none resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary py-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Diet Plan
              </button>
            </div>
          </form>
        </div>

        {/* Macros donut chart sidebar */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden">
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <HelpCircle className="h-4 w-4 text-cyan-400" />
              <h3 className="font-bold text-sm">Target Macro Ratios</h3>
            </div>

            {/* Inputs list for target parameters */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(e.target.value)}
                  className="glass-input w-full p-2 text-xs text-white focus:outline-none bg-black/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">
                  Water (ml)
                </label>
                <input
                  type="number"
                  value={targetWater}
                  onChange={(e) => setTargetWater(e.target.value)}
                  className="glass-input w-full p-2 text-xs text-white focus:outline-none bg-black/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  className="glass-input w-full p-2 text-xs text-white focus:outline-none bg-black/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(e.target.value)}
                  className="glass-input w-full p-2 text-xs text-white focus:outline-none bg-black/20"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-white/50 mb-1 uppercase tracking-wider">
                  Fats (g)
                </label>
                <input
                  type="number"
                  value={targetFats}
                  onChange={(e) => setTargetFats(e.target.value)}
                  className="glass-input w-full p-2 text-xs text-white focus:outline-none bg-black/20"
                />
              </div>
            </div>

            {/* Macro validity warning box */}
            <div className="pt-2">
              {macroValidation.isValid ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>✓ Macros add up correctly ({macroCalorieSum} kcal)</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: Macro total ({macroCalorieSum} kcal) deviates from target Calories ({targetCalories} kcal) by {macroValidation.percentDiff}%. Recommended ratio adjustment.
                  </span>
                </div>
              )}
            </div>

            {/* Macro ratios donut chart preview */}
            <div className="relative w-full h-[150px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS] ||
                          "#ffffff"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-2 border border-white/10 rounded-lg text-[10px] font-bold shadow-lg">
                            <span style={{ color: payload[0].color }}>
                              {payload[0].name}: {payload[0].value}% of macros
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black">{macroCalorieSum}</span>
                <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold">
                  kcal sum
                </span>
              </div>
            </div>

            {/* Legends list */}
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-white/50 border-t border-white/5 pt-3">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS],
                    }}
                  />
                  <span>
                    {entry.name} ({entry.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-[10px] text-white/20 font-medium pt-4 mt-6 border-t border-white/5">
            Calorie conversion: Protein=4, Carbs=4, Fat=9 kcal/g.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

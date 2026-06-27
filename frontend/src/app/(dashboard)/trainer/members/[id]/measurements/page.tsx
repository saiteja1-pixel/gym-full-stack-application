"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Scale,
  Calendar,
  Save,
  ArrowLeft,
  Loader,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { pageTransition } from "@/lib/animations";
import { formatDate } from "@/lib/utils";

interface Measurement {
  id: string;
  logDate: string;
  weight: number;
  height: number;
  bmi: number;
  bodyFat: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  biceps: number | null;
  thigh: number | null;
  notes: string | null;
}

interface Member {
  name: string;
  memberId: string;
}

export default function MeasurementsLoggerPage() {
  const { id: memberId } = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [biceps, setBiceps] = useState("");
  const [thigh, setThigh] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  const fetchDetails = useCallback(async () => {
    try {
      const [memberRes, progressRes] = await Promise.all([
        api.get(`/api/admin/members/${memberId}`),
        api.get(`/api/fitness/progress/${memberId}?range=all`),
      ]);
      setMember(memberRes.data);
      setHistory(progressRes.data);
      if (memberRes.data) {
        setHeight(memberRes.data.initialHeight.toString());
      }
    } catch (err) {
      console.error("Error loading metrics:", err);
      setError("Failed to load member profile or history logs.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Live BMI preview
  const liveBmi = useMemo(() => {
    const wt = parseFloat(weight);
    const ht = parseFloat(height);
    if (!wt || !ht || ht === 0) return null;
    return parseFloat((wt / Math.pow(ht / 100, 2)).toFixed(2));
  }, [weight, height]);

  const getBmiDetails = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { label: "Obese", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormSuccess("");
    setIsSubmitting(true);

    try {
      await api.post("/api/fitness/measurements", {
        memberId: String(memberId),
        weight,
        height,
        bodyFat: bodyFat || undefined,
        chest: chest || undefined,
        waist: waist || undefined,
        hip: hip || undefined,
        biceps: biceps || undefined,
        thigh: thigh || undefined,
        notes: notes || undefined,
      });

      setFormSuccess("Physical measurements logged successfully!");
      setWeight("");
      setBodyFat("");
      setChest("");
      setWaist("");
      setHip("");
      setBiceps("");
      setThigh("");
      setNotes("");

      fetchDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log measurements.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recharts line chart data (last 6 weights)
  const chartData = useMemo(() => {
    return history
      .slice(-6)
      .map((h) => ({
        date: formatDate(h.logDate),
        weight: h.weight,
      }));
  }, [history]);

  // Delta calculations for history records
  const historyWithDeltas = useMemo(() => {
    return history.map((curr, idx) => {
      if (idx === 0) return { ...curr, delta: 0 };
      const prev = history[idx - 1];
      return {
        ...curr,
        delta: curr.weight - prev.weight,
      };
    }).reverse(); // Sort desc for table
  }, [history]);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-medium">Opening metrics terminal...</p>
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
          Physical <span className="gradient-text">Metrics</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Assigned Member: <span className="text-white font-bold">{member?.name}</span> (
          {member?.memberId})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Logger Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-extrabold text-lg">Log Body Metrics</h3>
              <Scale className="h-5 w-5 text-white/40" />
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Weight (kg)*
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 75.4"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Height (cm)*
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g. 178"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="Optional"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Chest (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder="Optional"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Waist (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="Optional"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Hip (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                  placeholder="Optional"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Biceps (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={biceps}
                  onChange={(e) => setBiceps(e.target.value)}
                  placeholder="Optional"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                  Thigh (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={thigh}
                  onChange={(e) => setThigh(e.target.value)}
                  placeholder="Optional"
                  className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write any progress observation notes..."
                rows={2}
                className="glass-input w-full p-2.5 text-sm text-white focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
            {/* Live BMI display block */}
            <div className="flex items-center gap-3">
              {liveBmi !== null && (
                <>
                  <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">
                    Calculated BMI:
                  </span>
                  <span
                    className={`text-sm font-extrabold px-3 py-1 rounded-lg border uppercase tracking-wider ${
                      getBmiDetails(liveBmi).color
                    }`}
                  >
                    {liveBmi} - {getBmiDetails(liveBmi).label}
                  </span>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save Logs
            </button>
          </div>
        </form>

        {/* Recharts chart summary block */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-[380px] lg:h-auto">
          <div>
            <h3 className="font-extrabold text-sm flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-violet-400" />
              <span>Weight Progress Chart</span>
            </h3>
            <p className="text-xs text-white/40 mt-0.5">Last 6 measurement logs in kg</p>
          </div>

          <div className="flex-1 w-full min-h-0 mt-6 pb-2">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-white/30 font-medium">
                Log measurements to show trend line.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.25)"
                    fontSize={9}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.25)"
                    fontSize={9}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="glass-panel p-2 border border-white/10 rounded-lg shadow-lg text-xs font-bold">
                            <span className="text-white/60 block mb-0.5">
                              {payload[0].payload.date}
                            </span>
                            <span className="text-violet-400">
                              Weight: {payload[0].value} kg
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="rgb(124, 58, 237)"
                    strokeWidth={2}
                    dot={{ fill: "rgb(34, 211, 238)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Full measurement records table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Historical Logs History</span>
          </h3>
        </div>

        {historyWithDeltas.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-10">No measurement records registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-white/50 uppercase font-bold tracking-wider bg-white/[0.01]">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4">Weight Delta</th>
                  <th className="px-6 py-4">BMI</th>
                  <th className="px-6 py-4">Body Fat %</th>
                  <th className="px-6 py-4">Waist Line</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {historyWithDeltas.map((h) => (
                  <tr key={h.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-medium text-white/80">
                      {formatDate(h.logDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {h.weight} kg
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {h.delta === 0 ? (
                        <span className="text-white/40">● 0.0 kg</span>
                      ) : h.delta < 0 ? (
                        <span className="text-emerald-400">▼ {Math.abs(h.delta).toFixed(1)} kg</span>
                      ) : (
                        <span className="text-amber-400">▲ {h.delta.toFixed(1)} kg</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          getBmiDetails(h.bmi).color
                        }`}
                      >
                        {h.bmi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {h.bodyFat !== null ? `${h.bodyFat}%` : "—"}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {h.waist !== null ? `${h.waist} in` : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 max-w-xs truncate">
                      {h.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

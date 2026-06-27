"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader,
  AlertTriangle,
  Activity,
  TrendingDown,
  TrendingUp,
  Percent,
} from "lucide-react";
import {
  ComposedChart,
  Area,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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

const CustomGlassTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md bg-zinc-950/80">
        <p className="text-white/60 text-xs mb-1 font-semibold">
          {formatDate(label)}
        </p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.name === "Weight" ? "kg" : entry.name === "Body Fat" ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MemberProgressPage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [range, setRange] = useState<"30d" | "3m" | "6m" | "all">("30d");
  const [history, setHistory] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let currentMemberId = memberId;
      if (!currentMemberId) {
        const meResponse = await api.get("/api/auth/me");
        const profile = meResponse.data.memberProfile;
        if (!profile) {
          setError("No member profile associated with this account.");
          setLoading(false);
          return;
        }
        currentMemberId = profile.id;
        setMemberId(profile.id);
      }

      // Fetch historical logs
      const response = await api.get(
        `/api/fitness/progress/${currentMemberId}?range=${range}`
      );
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load progress details:", err);
      setError("Could not load your physical metrics history.");
    } finally {
      setLoading(false);
    }
  }, [memberId, range]);

  useEffect(() => {
    loadData();
  }, [range]);

  // Clean data for body fat chart (filter out null values to prevent chart from rendering zeros)
  const bodyFatChartData = useMemo(() => {
    return history
      .filter((m) => m.bodyFat !== null && m.bodyFat !== undefined)
      .map((m) => ({
        logDate: m.logDate,
        "Body Fat": m.bodyFat,
      }));
  }, [history]);

  // Retrieve the latest measurement record
  const latestMetric = useMemo(() => {
    if (history.length === 0) return null;
    return history[history.length - 1];
  }, [history]);

  // Compile history items with delta calculations compared to previous chronologically
  const tableDataWithDeltas = useMemo(() => {
    return history.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          weightDelta: null,
          bmiDelta: null,
          bodyFatDelta: null,
          waistDelta: null,
        };
      }
      const prev = history[index - 1];
      return {
        ...item,
        weightDelta: item.weight - prev.weight,
        bmiDelta: item.bmi - prev.bmi,
        bodyFatDelta:
          item.bodyFat !== null && prev.bodyFat !== null
            ? item.bodyFat - prev.bodyFat
            : null,
        waistDelta:
          item.waist !== null && prev.waist !== null
            ? item.waist - prev.waist
            : null,
      };
    }).reverse(); // Sort table by newest first
  }, [history]);

  const renderDeltaIndicator = (value: number | null) => {
    if (value === null || value === 0) return <span className="text-white/30">-</span>;
    const isDown = value < 0;
    // For weight/BMI/bodyfat/waist, going down is improvement (green), going up is regression (red)
    const colorClass = isDown ? "text-emerald-400" : "text-rose-400";
    const Icon = isDown ? TrendingDown : TrendingUp;

    return (
      <span className={`inline-flex items-center gap-1 font-semibold text-xs ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{Math.abs(value).toFixed(1)}</span>
      </span>
    );
  };

  const getBmiStatus = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    if (bmi < 25) return { label: "Normal Weight", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { label: "Obese", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header with Range Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Progress <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Analyze logs and monitor physical transformations.
          </p>
        </div>

        {/* Range Selector Pill Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/5 self-start sm:self-center">
          {(["30d", "3m", "6m", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                range === r
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              {r === "30d" ? "30 Days" : r === "3m" ? "3 Months" : r === "6m" ? "6 Months" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {loading && history.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Loader className="h-8 w-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-medium">Loading physical baseline graphs...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center max-w-md mx-auto rounded-2xl border border-white/5">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-semibold">{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel py-20 text-center rounded-2xl border border-white/5 space-y-4">
          <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 inline-flex text-white/20">
            <Activity className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No Metrics Logged</h3>
            <p className="text-white/40 text-sm max-w-xs mx-auto mt-1">
              Your trainer hasn't recorded physical measurements yet. Log details will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Row: Latest BMI & Measurements Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* BMI Summary Card */}
            {latestMetric && (
              <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-[-30%] left-[-10%] w-[180px] h-[180px] rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    Latest BMI Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-2 font-inter">
                    <h3 className="text-5xl font-black text-white">{latestMetric.bmi}</h3>
                    <span className="text-xs text-white/40 font-semibold ml-2">kg/m²</span>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border ${
                        getBmiStatus(latestMetric.bmi).color
                      }`}
                    >
                      {getBmiStatus(latestMetric.bmi).label}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 text-xs text-white/40 space-y-1 font-medium">
                  <p>Height Baseline: <span className="text-white font-bold">{latestMetric.height} cm</span></p>
                  <p>Weight Logged: <span className="text-white font-bold">{latestMetric.weight} kg</span></p>
                  <p>Log Date: <span className="text-white font-bold">{formatDate(latestMetric.logDate)}</span></p>
                </div>
              </div>
            )}

            {/* Circumference Body Map Panel */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Percent className="w-4 h-4 text-cyan-400" />
                  <span>Circumference Body Map</span>
                </h3>
                <p className="text-xs text-white/40">Latest limb metrics recorded (in cm).</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { name: "Chest", value: latestMetric?.chest },
                  { name: "Waist", value: latestMetric?.waist },
                  { name: "Hip", value: latestMetric?.hip },
                  { name: "Biceps", value: latestMetric?.biceps },
                  { name: "Thigh", value: latestMetric?.thigh },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center"
                  >
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                      {c.name}
                    </span>
                    <h4 className="text-xl font-extrabold mt-1 text-white">
                      {c.value ? `${c.value} cm` : "N/A"}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recharts Graphical Dashboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight & BMI Dual Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div>
                <h3 className="font-bold text-sm">Weight & BMI Trend</h3>
                <p className="text-xs text-white/40">Dual-axis representation of body mass dynamics.</p>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(139, 92, 246)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="rgb(139, 92, 246)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(6, 182, 212)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="rgb(6, 182, 212)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="logDate"
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      stroke="rgba(255,255,255,0.3)"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="rgb(139, 92, 246)"
                      style={{ fontSize: "10px" }}
                      domain={["auto", "auto"]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="rgb(6, 182, 212)"
                      style={{ fontSize: "10px" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip content={<CustomGlassTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      name="Weight"
                      dataKey="weight"
                      stroke="rgb(139, 92, 246)"
                      fill="url(#weightGrad)"
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      name="BMI"
                      dataKey="bmi"
                      stroke="rgb(6, 182, 212)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      yAxisId="right"
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Body Fat Percentage Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <div>
                <h3 className="font-bold text-sm">Body Fat Trend</h3>
                <p className="text-xs text-white/40">Visualizing body composition fat percentage changes.</p>
              </div>

              <div className="h-[300px]">
                {bodyFatChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-white/20 text-xs font-semibold">
                    No body fat measurements recorded in this range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bodyFatChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="logDate"
                        tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        stroke="rgba(255,255,255,0.3)"
                        style={{ fontSize: "10px" }}
                      />
                      <YAxis
                        stroke="rgb(244, 63, 94)"
                        style={{ fontSize: "10px" }}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip content={<CustomGlassTooltip />} />
                      <Line
                        type="monotone"
                        name="Body Fat"
                        dataKey="Body Fat"
                        stroke="rgb(244, 63, 94)"
                        strokeWidth={3}
                        dot={{ r: 4, stroke: "rgb(244, 63, 94)", strokeWidth: 2, fill: "#09090b" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Historical Baseline Logs Table */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-bold text-sm">Baseline Logs & Deltas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/50 text-[10px] uppercase font-bold tracking-wider bg-white/[0.01]">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Weight (kg)</th>
                    <th className="px-6 py-4">Weight Delta</th>
                    <th className="px-6 py-4">BMI (kg/m²)</th>
                    <th className="px-6 py-4">BMI Delta</th>
                    <th className="px-6 py-4">Body Fat %</th>
                    <th className="px-6 py-4">Waist (cm)</th>
                    <th className="px-6 py-4">Waist Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {tableDataWithDeltas.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-white/60">
                        {formatDate(row.logDate)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        {row.weight} kg
                      </td>
                      <td className="px-6 py-4">
                        {renderDeltaIndicator(row.weightDelta)}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {row.bmi}
                      </td>
                      <td className="px-6 py-4">
                        {renderDeltaIndicator(row.bmiDelta)}
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {row.bodyFat ? `${row.bodyFat}%` : "-"}
                      </td>
                      <td className="px-6 py-4 text-white/80">
                        {row.waist ? `${row.waist} cm` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {renderDeltaIndicator(row.waistDelta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

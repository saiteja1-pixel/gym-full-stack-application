"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: LucideIcon;
  glowColor: "purple" | "cyan" | "emerald" | "amber" | "rose";
}

const colorMap = {
  purple: "rgba(124, 58, 237, 0.25)",
  cyan: "rgba(14, 116, 144, 0.25)",
  emerald: "rgba(16, 185, 129, 0.25)",
  amber: "rgba(245, 158, 11, 0.25)",
  rose: "rgba(244, 63, 94, 0.25)",
};

const borderHoverMap = {
  purple: "hover:border-violet-500/35",
  cyan: "hover:border-cyan-500/35",
  emerald: "hover:border-emerald-500/35",
  amber: "hover:border-amber-500/35",
  rose: "hover:border-rose-500/35",
};

export default function AnalyticsCard({
  title,
  value,
  trend,
  trendDirection = "neutral",
  icon: Icon,
  glowColor,
}: AnalyticsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`glass-panel p-6 rounded-2xl relative overflow-hidden ${borderHoverMap[glowColor]} transition-all duration-300 group`}
    >
      {/* Glow Backdrop */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none transition-opacity duration-300 opacity-40 group-hover:opacity-100"
        style={{ backgroundColor: colorMap[glowColor] }}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-white/50 text-xs font-semibold uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 group-hover:border-white/10 group-hover:bg-white/[0.05] transition-colors">
          <Icon className="h-5 w-5 text-white/70 group-hover:text-white" />
        </div>
      </div>

      <h3 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
        {value}
      </h3>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`font-bold ${
              trendDirection === "up"
                ? "text-emerald-400"
                : trendDirection === "down"
                ? "text-rose-400"
                : "text-white/40"
            }`}
          >
            {trendDirection === "up" ? "▲" : trendDirection === "down" ? "▼" : "●"}{" "}
            {trend}
          </span>
          <span className="text-white/40">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Edit2, ShieldAlert, Award, Calendar, Percent, RefreshCw } from "lucide-react";
import { interactiveHover } from "@/lib/animations";

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  durationDays: number;
  joiningFee: number;
  gstPercent: number;
  freezeDays: number;
  description: string | null;
  isActive: boolean;
}

interface PlanCardProps {
  plan: MembershipPlan;
  onEdit: (plan: MembershipPlan) => void;
  onToggleActive: (plan: MembershipPlan) => void;
}

export default function PlanCard({ plan, onEdit, onToggleActive }: PlanCardProps) {
  const getDurationLabel = (duration: string) => {
    switch (duration) {
      case "MONTHLY": return "Monthly";
      case "QUARTERLY": return "Quarterly";
      case "SEMI_ANNUAL": return "Semi-Annual";
      case "ANNUAL": return "Annual";
      default: return "Custom";
    }
  };

  return (
    <motion.div
      variants={interactiveHover}
      whileHover="whileHover"
      whileTap="whileTap"
      className={`glass-panel p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-[320px] ${
        plan.isActive
          ? "border-violet-500/20 hover:border-violet-500/40"
          : "border-white/5 opacity-60"
      }`}
    >
      {/* Decorative Glow */}
      {plan.isActive && (
        <div className="absolute top-[-30%] right-[-10%] w-[150px] h-[150px] rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
      )}

      {/* Header */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-semibold tracking-widest text-violet-400 uppercase">
              {getDurationLabel(plan.duration)}
            </span>
            <h3 className="text-xl font-bold mt-1 text-white truncate max-w-[180px]">{plan.name}</h3>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              plan.isActive ? "badge-active" : "badge-expired"
            }`}
          >
            {plan.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Price Tag */}
        <div className="flex items-baseline gap-1 my-3">
          <span className="text-3xl font-extrabold text-white">₹{plan.price.toLocaleString()}</span>
          <span className="text-xs text-white/40">/ {plan.durationDays} days</span>
        </div>

        <p className="text-sm text-white/60 line-clamp-2 h-10 mb-4">{plan.description || "No description provided."}</p>
      </div>

      {/* Badges / Stats */}
      <div className="space-y-2 border-t border-white/5 pt-4">
        <div className="flex justify-between text-xs text-white/50">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Freeze Days</span>
          <span className="font-semibold text-white">{plan.freezeDays} days</span>
        </div>
        <div className="flex justify-between text-xs text-white/50">
          <span className="flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Tax (GST)</span>
          <span className="font-semibold text-white">{plan.gstPercent}% Included</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onEdit(plan)}
          className="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => onToggleActive(plan)}
          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
            plan.isActive
              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
          }`}
        >
          {plan.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </motion.div>
  );
}

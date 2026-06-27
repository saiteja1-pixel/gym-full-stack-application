"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Loader } from "lucide-react";
import { slideUp, fadeInOut } from "@/lib/animations";
import api from "@/lib/api";
import { MembershipPlan } from "./PlanCard";

interface RenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}

export default function RenewModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  onSuccess
}: RenewModalProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setError("");
    try {
      const response = await api.get("/api/admin/membership-plans");
      const activePlans = response.data.filter((p: MembershipPlan) => p.isActive);
      setPlans(activePlans);
      if (activePlans.length > 0) {
        setSelectedPlanId(activePlans[0].id);
      }
    } catch (err: any) {
      setError("Failed to load membership plans.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      setError("Please select a plan.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.put(`/api/admin/members/${memberId}/renew`, { planId: selectedPlanId });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to renew membership.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop */}
          <motion.div
            variants={fadeInOut}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-panel p-6 rounded-3xl border border-white/10 w-full max-w-md relative z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin-slow" />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center">Renew Membership</h3>
            <p className="text-xs text-white/40 mt-1 text-center font-medium">
              Choose a new membership package for <span className="text-white font-semibold">{memberName}</span>.
            </p>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs mt-4">
                {error}
              </div>
            )}

            {loadingPlans ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="text-xs text-white/60 font-medium block mb-1.5">Select Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="glass-input cursor-pointer"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#09090b] text-white">
                        {p.name} (₹{p.price} / {p.durationDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors border border-white/10 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedPlanId}
                    className="flex-1 btn-primary py-3 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <Loader className="w-4 h-4 animate-spin" /> : "Renew Now"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

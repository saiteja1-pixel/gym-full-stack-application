"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, X, Loader } from "lucide-react";
import { slideUp, fadeInOut } from "@/lib/animations";
import api from "@/lib/api";

interface FreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  maxFreezeDays: number;
  onSuccess: () => void;
}

export default function FreezeModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  maxFreezeDays,
  onSuccess
}: FreezeModalProps) {
  const [freezeDays, setFreezeDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (freezeDays <= 0) {
      setError("Please enter a valid number of days.");
      return;
    }
    if (freezeDays > maxFreezeDays) {
      setError(`Maximum allowable freeze days for this plan is ${maxFreezeDays}.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.put(`/api/admin/members/${memberId}/freeze`, { freezeDays });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to freeze membership.");
    } finally {
      setLoading(false);
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
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 mx-auto">
              <Snowflake className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center">Freeze Membership</h3>
            <p className="text-xs text-white/40 mt-1 text-center">
              Temporarily freeze membership for <span className="text-white font-semibold">{memberName}</span>.
            </p>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs mt-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Number of Freeze Days</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={maxFreezeDays}
                  value={freezeDays}
                  onChange={(e) => setFreezeDays(parseInt(e.target.value, 10))}
                  className="glass-input text-center text-lg font-bold"
                />
                <span className="text-[10px] text-white/30 mt-1.5 block text-center">
                  This plan allows up to {maxFreezeDays} total freeze days.
                </span>
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
                  disabled={loading}
                  className="flex-1 btn-primary py-3 rounded-xl flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Confirm Freeze"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader, HelpCircle } from "lucide-react";
import api from "@/lib/api";
import PlanCard, { MembershipPlan } from "@/components/admin/PlanCard";
import { pageTransition, listContainer } from "@/lib/animations";

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [error, setError] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("MONTHLY");
  const [durationDays, setDurationDays] = useState("30");
  const [joiningFee, setJoiningFee] = useState("0");
  const [gstPercent, setGstPercent] = useState("18.0");
  const [freezeDays, setFreezeDays] = useState("0");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/membership-plans");
      setPlans(response.data);
    } catch (err: any) {
      setError("Failed to load membership plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName("");
    setPrice("");
    setDuration("MONTHLY");
    setDurationDays("30");
    setJoiningFee("0");
    setGstPercent("18.0");
    setFreezeDays("0");
    setDescription("");
    setError("");
    setDrawerOpen(true);
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price.toString());
    setDuration(plan.duration);
    setDurationDays(plan.durationDays.toString());
    setJoiningFee(plan.joiningFee.toString());
    setGstPercent(plan.gstPercent.toString());
    setFreezeDays(plan.freezeDays.toString());
    setDescription(plan.description || "");
    setError("");
    setDrawerOpen(true);
  };

  const handleToggleActive = async (plan: MembershipPlan) => {
    try {
      const updatedPlan = await api.put(`/api/admin/membership-plans/${plan.id}`, {
        isActive: !plan.isActive
      });
      setPlans(plans.map((p) => (p.id === plan.id ? updatedPlan.data : p)));
    } catch (err: any) {
      alert("Failed to update plan status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const planData = {
      name,
      price: parseFloat(price),
      duration,
      durationDays: parseInt(durationDays, 10),
      joiningFee: parseFloat(joiningFee),
      gstPercent: parseFloat(gstPercent),
      freezeDays: parseInt(freezeDays, 10),
      description
    };

    try {
      if (editingPlan) {
        const response = await api.put(`/api/admin/membership-plans/${editingPlan.id}`, planData);
        setPlans(plans.map((p) => (p.id === editingPlan.id ? response.data : p)));
      } else {
        const response = await api.post("/api/admin/membership-plans", planData);
        setPlans([response.data, ...plans]);
      }
      setDrawerOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred while saving the plan.");
    }
  };

  const updateDurationDays = (durationValue: string) => {
    setDuration(durationValue);
    switch (durationValue) {
      case "MONTHLY":
        setDurationDays("30");
        break;
      case "QUARTERLY":
        setDurationDays("90");
        break;
      case "SEMI_ANNUAL":
        setDurationDays("180");
        break;
      case "ANNUAL":
        setDurationDays("365");
        break;
      default:
        break;
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Membership <span className="gradient-text">Plans</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">Configure subscription packages and pricing modules.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {error && !drawerOpen && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
          <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No Plans Found</h3>
          <p className="text-sm text-white/40 mt-1 mb-6">Create your first membership plan to get started.</p>
          <button onClick={handleOpenCreate} className="btn-primary py-2 px-4 rounded-xl text-xs">
            Create Plan
          </button>
        </div>
      ) : (
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleOpenEdit}
              onToggleActive={handleToggleActive}
            />
          ))}
        </motion.div>
      )}

      {/* Side Drawer Dialog */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0c0c0e] border-l border-white/10 p-6 z-50 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {editingPlan ? "Edit Plan" : "Create New Plan"}
                  </h3>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-white/60 font-medium block mb-1.5">Plan Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gold Quarterly Package"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="glass-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/60 font-medium block mb-1.5">Price (₹)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/60 font-medium block mb-1.5">Joining Fee (₹)</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={joiningFee}
                        onChange={(e) => setJoiningFee(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/60 font-medium block mb-1.5">Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => updateDurationDays(e.target.value)}
                        className="glass-input cursor-pointer"
                      >
                        <option value="MONTHLY" className="bg-[#09090b]">Monthly</option>
                        <option value="QUARTERLY" className="bg-[#09090b]">Quarterly</option>
                        <option value="SEMI_ANNUAL" className="bg-[#09090b]">Semi-Annual</option>
                        <option value="ANNUAL" className="bg-[#09090b]">Annual</option>
                        <option value="CUSTOM" className="bg-[#09090b]">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/60 font-medium block mb-1.5">Duration (Days)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="30"
                        value={durationDays}
                        disabled={duration !== "CUSTOM"}
                        onChange={(e) => setDurationDays(e.target.value)}
                        className="glass-input disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/60 font-medium block mb-1.5">GST Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        placeholder="18.0"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/60 font-medium block mb-1.5">Max Freeze Days</label>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={freezeDays}
                        onChange={(e) => setFreezeDays(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-white/60 font-medium block mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter details about this plan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="glass-input resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors border border-white/10 text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-primary py-3 rounded-xl"
                    >
                      {editingPlan ? "Update Plan" : "Create Plan"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

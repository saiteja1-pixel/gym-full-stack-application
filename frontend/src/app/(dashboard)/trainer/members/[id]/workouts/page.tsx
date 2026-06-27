"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Loader,
  AlertTriangle,
  CheckCircle,
  Archive,
  Eye,
} from "lucide-react";
import api from "@/lib/api";
import { pageTransition } from "@/lib/animations";
import { formatDate } from "@/lib/utils";

interface ExerciseInput {
  keyId: string; // React list rendering unique key
  exerciseName: string;
  sets: string;
  reps: string;
  targetWeight: string;
  videoUrl: string;
  notes: string;
}

interface ActivePlan {
  id: string;
  assignedDate: string;
  workoutPlan: {
    title: string;
    description: string | null;
    exercises: Array<{
      id: string;
      exerciseName: string;
      sets: number;
      reps: number;
      targetWeight: number | null;
      videoUrl: string | null;
      notes: string | null;
    }>;
  };
}

interface Member {
  name: string;
  memberId: string;
}

export default function WorkoutBuilderPage() {
  const { id: memberId } = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    {
      keyId: Math.random().toString(),
      exerciseName: "",
      sets: "3",
      reps: "12",
      targetWeight: "",
      videoUrl: "",
      notes: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [showActiveExercises, setShowActiveExercises] = useState(false);

  const fetchWorkoutDetails = useCallback(async () => {
    try {
      const [memberRes, workoutRes] = await Promise.all([
        api.get(`/api/admin/members/${memberId}`),
        api.get(`/api/fitness/workouts?memberId=${memberId}`),
      ]);
      setMember(memberRes.data);
      setActivePlan(workoutRes.data);
    } catch (err) {
      console.error("Error loading workouts data:", err);
      setError("Failed to load workout assignment details.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchWorkoutDetails();
  }, [fetchWorkoutDetails]);

  const handleAddRow = () => {
    setExercises((prev) => [
      ...prev,
      {
        keyId: Math.random().toString(),
        exerciseName: "",
        sets: "3",
        reps: "12",
        targetWeight: "",
        videoUrl: "",
        notes: "",
      },
    ]);
  };

  const handleDeleteRow = (keyId: string) => {
    if (exercises.length === 1) return; // Keep at least one row
    setExercises((prev) => prev.filter((item) => item.keyId !== keyId));
  };

  const handleFieldChange = (keyId: string, field: keyof ExerciseInput, val: string) => {
    setExercises((prev) =>
      prev.map((item) => (item.keyId === keyId ? { ...item, [field]: val } : item))
    );
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormSuccess("");
    setIsSubmitting(true);

    // Validate exercises input
    const invalidExercise = exercises.some((ex) => !ex.exerciseName || !ex.sets || !ex.reps);
    if (invalidExercise) {
      setError("Please fill out Exercise Name, Sets, and Reps for all workout rows.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/api/fitness/workouts", {
        memberId: String(memberId),
        title,
        description,
        exercises: exercises.map(({ keyId, ...rest }) => rest),
      });

      setFormSuccess("Workout plan successfully assigned!");
      setTitle("");
      setDescription("");
      setExercises([
        {
          keyId: Math.random().toString(),
          exerciseName: "",
          sets: "3",
          reps: "12",
          targetWeight: "",
          videoUrl: "",
          notes: "",
        },
      ]);
      fetchWorkoutDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to assign workout plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchivePlan = async () => {
    if (!activePlan) return;
    setError("");
    setFormSuccess("");
    try {
      await api.put(`/api/fitness/workouts/assignments/${activePlan.id}/archive`);
      setFormSuccess("Active workout plan archived successfully.");
      setActivePlan(null);
    } catch (err: any) {
      setError("Failed to archive active plan.");
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-medium">Opening workout terminal...</p>
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
          Workout <span className="gradient-text">Planner</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Assign client routine exercises: <span className="text-white font-bold">{member?.name}</span> (
          {member?.memberId})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Workout Form Builder */}
        <form
          onSubmit={handleSavePlan}
          className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-white/5 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-extrabold text-lg">Build Routine Workout Plan</h3>
            <Dumbbell className="h-5 w-5 text-white/40" />
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

          {/* Form details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Workout Plan Title*
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Intermediate Push Routine"
                className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                Description / Target Areas
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Chest, shoulders, and triceps hypertrophy"
                className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Table list of exercises */}
          <div className="space-y-3 pt-4">
            <div className="text-xs text-white/40 uppercase font-bold tracking-wider">
              Checklist Exercises
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {exercises.map((ex, index) => (
                  <motion.div
                    key={ex.keyId}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col sm:flex-row gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl items-stretch sm:items-end relative"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-white/30 font-bold uppercase mb-1">
                          Exercise {index + 1} Name*
                        </label>
                        <input
                          type="text"
                          value={ex.exerciseName}
                          onChange={(e) =>
                            handleFieldChange(ex.keyId, "exerciseName", e.target.value)
                          }
                          placeholder="e.g. Bench Press"
                          className="glass-input w-full p-2 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1.5">
                        <label className="block text-[10px] text-white/30 font-bold uppercase mb-1">
                          Sets*
                        </label>
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => handleFieldChange(ex.keyId, "sets", e.target.value)}
                          className="glass-input w-full p-2 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="sm:col-span-1.5">
                        <label className="block text-[10px] text-white/30 font-bold uppercase mb-1">
                          Reps*
                        </label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => handleFieldChange(ex.keyId, "reps", e.target.value)}
                          className="glass-input w-full p-2 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-white/30 font-bold uppercase mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={ex.targetWeight}
                          onChange={(e) =>
                            handleFieldChange(ex.keyId, "targetWeight", e.target.value)
                          }
                          placeholder="Optional"
                          className="glass-input w-full p-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-white/30 font-bold uppercase mb-1">
                          Video link / Notes
                        </label>
                        <input
                          type="text"
                          value={ex.videoUrl}
                          onChange={(e) => handleFieldChange(ex.keyId, "videoUrl", e.target.value)}
                          placeholder="URL or Notes"
                          className="glass-input w-full p-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={exercises.length === 1}
                      onClick={() => handleDeleteRow(ex.keyId)}
                      className="p-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-xl transition-all self-end shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="mt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Exercise Row</span>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary py-2 px-5 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save & Assign Plan
            </button>
          </div>
        </form>

        {/* Active plan status tracker sidebar */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden">
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <h3 className="font-bold text-sm">Active Plan Details</h3>
            </div>

            {activePlan ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-black text-white">
                    {activePlan.workoutPlan.title}
                  </h4>
                  <p className="text-xs text-white/50 mt-1 leading-snug">
                    {activePlan.workoutPlan.description || "No description provided."}
                  </p>
                  <span className="text-[10px] text-white/30 font-bold block mt-2">
                    Assigned: {formatDate(activePlan.assignedDate)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowActiveExercises((s) => !s)}
                    className="flex-1 py-2 px-3 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white/[0.02] hover:bg-white/[0.05]"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{showActiveExercises ? "Hide" : "View"} Exercises</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleArchivePlan}
                    className="py-2 px-3 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </button>
                </div>

                {/* Show exercises inline */}
                {showActiveExercises && (
                  <div className="space-y-2 pt-3 border-t border-white/5 text-xs">
                    {activePlan.workoutPlan.exercises.map((ex, idx) => (
                      <div key={ex.id} className="p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
                        <div className="flex justify-between font-semibold">
                          <span>
                            {idx + 1}. {ex.exerciseName}
                          </span>
                          <span className="text-violet-400">
                            {ex.sets} sets x {ex.reps} reps
                          </span>
                        </div>
                        {ex.targetWeight && (
                          <div className="text-[10px] text-white/40 mt-1">
                            Target Weight: {ex.targetWeight} kg
                          </div>
                        )}
                        {ex.notes && (
                          <div className="text-[10px] text-white/40 mt-0.5">
                            Notes: {ex.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/40 text-center py-12">
                No active workout assignments listed. Build and assign a plan.
              </p>
            )}
          </div>
          <div className="pt-4 border-t border-white/5 mt-6 text-center text-[10px] text-white/30 font-medium">
            Plan will override previous assignments instantly.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

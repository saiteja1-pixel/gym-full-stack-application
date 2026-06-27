"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Loader,
  AlertTriangle,
  Play,
  Check,
  Award,
  X,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import { pageTransition, listContainer, listItem } from "@/lib/animations";

interface Exercise {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
  targetWeight: number | null;
  videoUrl: string | null;
  notes: string | null;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string | null;
  exercises: Exercise[];
  trainer?: {
    name: string;
  } | null;
}

interface WorkoutAssignment {
  id: string;
  workoutPlan: WorkoutPlan;
}

export default function MemberWorkoutsPage() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<WorkoutAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Checklist state
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [todayStr, setTodayStr] = useState("");

  // Modal states
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutSubmitted, setWorkoutSubmitted] = useState(false);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  const loadWorkout = useCallback(async () => {
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

      const response = await api.get(`/api/fitness/workouts?memberId=${profile.id}`);
      setAssignment(response.data);

      // Load checklist from local storage
      const dateStr = getTodayString();
      setTodayStr(dateStr);
      const storageKey = `workout_checklist_${profile.id}_${dateStr}`;
      const savedChecks = localStorage.getItem(storageKey);

      if (savedChecks) {
        try {
          setCheckedIds(JSON.parse(savedChecks));
        } catch {
          setCheckedIds([]);
        }
      } else {
        // Clear out any older keys to save storage space
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`workout_checklist_${profile.id}_`)) {
            localStorage.removeItem(key);
          }
        }
        setCheckedIds([]);
      }
    } catch (err) {
      console.error("Failed to load workout routine:", err);
      setError("Could not load your assigned workout plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  // Persist checked items to local storage
  const handleToggleCheck = (exerciseId: string) => {
    if (!memberId || !todayStr) return;
    const key = `workout_checklist_${memberId}_${todayStr}`;
    let updated: string[];

    if (checkedIds.includes(exerciseId)) {
      updated = checkedIds.filter((id) => id !== exerciseId);
    } else {
      updated = [...checkedIds, exerciseId];
    }

    setCheckedIds(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const plan = assignment?.workoutPlan;
  const exercises = plan?.exercises || [];

  const allCompleted = useMemo(() => {
    if (exercises.length === 0) return false;
    return exercises.every((ex) => checkedIds.includes(ex.id));
  }, [exercises, checkedIds]);

  const progressPercent = useMemo(() => {
    if (exercises.length === 0) return 0;
    return Math.round((checkedIds.length / exercises.length) * 100);
  }, [exercises, checkedIds]);

  // Parse embeddable video URL (e.g. YouTube watch to embed)
  const getEmbeddableVideoUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !assignment) return;
    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/api/fitness/workouts/progress", {
        memberId,
        assignmentId: assignment.id,
        completed: true,
        feedback: feedback || null,
      });

      // Clear local storage and state checks
      const key = `workout_checklist_${memberId}_${todayStr}`;
      localStorage.removeItem(key);
      setCheckedIds([]);
      setFeedback("");
      setShowFeedbackModal(false);
      setWorkoutSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to log workout completion.");
    } finally {
      setIsSubmitting(false);
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Daily <span className="gradient-text">Workouts</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Perform your assigned routine exercises, check progress, and watch tutorials.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader className="h-8 w-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-medium">Fetching active daily routine...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center max-w-md mx-auto rounded-2xl border border-white/5">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-semibold">{error}</p>
        </div>
      ) : workoutSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel py-20 text-center rounded-2xl border border-white/5 space-y-5 max-w-md mx-auto"
        >
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/25 inline-flex text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Award className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Workout Logged!</h3>
            <p className="text-white/40 text-sm mt-2 px-6">
              Great job! Your training logs and notes have been registered. Recover well for your next session.
            </p>
          </div>
          <button
            onClick={() => setWorkoutSubmitted(false)}
            className="py-2 px-6 bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 text-white rounded-xl font-bold text-sm cursor-pointer shadow-lg"
          >
            Track Next Day
          </button>
        </motion.div>
      ) : !assignment || exercises.length === 0 ? (
        <div className="glass-panel py-20 text-center rounded-2xl border border-white/5 space-y-4">
          <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 inline-flex text-white/20">
            <Dumbbell className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-lg font-bold">🌙 Rest Day</h3>
            <p className="text-white/40 text-sm max-w-xs mx-auto mt-1">
              No active workout routine has been assigned to you today. Relax and recover!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Workout Checklist (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Workout Tracker progress bar */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/80">Workout Completion</span>
                <span className="text-cyan-400 font-inter">{checkedIds.length} of {exercises.length} Exercises</span>
              </div>
              <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full"
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* List of exercises */}
            <motion.div
              variants={listContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {exercises.map((ex) => {
                const isChecked = checkedIds.includes(ex.id);
                return (
                  <motion.div
                    key={ex.id}
                    variants={listItem}
                    layoutId={ex.id}
                    className={`glass-panel p-5 rounded-2xl border border-white/5 flex items-center justify-between gap-4 transition-all duration-300 ${
                      isChecked ? "opacity-30" : "hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox trigger */}
                      <button
                        onClick={() => handleToggleCheck(ex.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                          isChecked
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "border-white/20 hover:border-violet-500 bg-white/5"
                        }`}
                      >
                        <motion.div
                          initial={false}
                          animate={isChecked ? { scale: 1 } : { scale: 0 }}
                          transition={{ type: "spring", stiffness: 600, damping: 30 }}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </motion.div>
                      </button>

                      {/* Exercise Meta details */}
                      <div className="space-y-1">
                        <h4
                          className={`text-lg font-bold text-white transition-all ${
                            isChecked ? "line-through" : ""
                          }`}
                        >
                          {ex.exerciseName}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50 font-medium">
                          <span>
                            Sets: <strong className="text-white font-inter">{ex.sets}</strong>
                          </span>
                          <span>
                            Reps: <strong className="text-white font-inter">{ex.reps}</strong>
                          </span>
                          {ex.targetWeight && (
                            <span>
                              Weight: <strong className="text-white font-inter">{ex.targetWeight} kg</strong>
                            </span>
                          )}
                        </div>
                        {ex.notes && (
                          <p className="text-xs text-white/40 mt-1.5 italic font-medium">
                            Notes: {ex.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tutorial Action */}
                    {ex.videoUrl && (
                      <button
                        onClick={() => setActiveVideoUrl(ex.videoUrl)}
                        className="py-1.5 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-400 transition-all font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Watch Form</span>
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Routine Meta details (4 Cols Sidebar) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden space-y-5">
              <div className="absolute top-[-30%] right-[-10%] w-[150px] h-[150px] rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
              
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Assigned Routine
                </span>
                <h3 className="text-2xl font-black mt-1 leading-tight text-white">
                  {plan?.title}
                </h3>
                {plan?.description && (
                  <p className="text-xs text-white/50 mt-2 font-medium">
                    {plan?.description}
                  </p>
                )}
              </div>

              {plan?.trainer && (
                <div className="pt-4 border-t border-white/5 text-xs">
                  <span className="text-white/40 font-medium">Assigned By:</span>
                  <p className="font-extrabold text-white mt-0.5">{plan?.trainer?.name}</p>
                </div>
              )}

              {/* Submit Workout Button */}
              <button
                onClick={() => setShowFeedbackModal(true)}
                disabled={!allCompleted}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm shadow-xl transition-all duration-300 ${
                  allCompleted
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white cursor-pointer hover:opacity-90"
                    : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }`}
              >
                Submit Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WATCH FORM MODAL */}
      <AnimatePresence>
        {activeVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-3xl aspect-video glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
              {/* Close Button */}
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video Player */}
              <iframe
                src={getEmbeddableVideoUrl(activeVideoUrl)}
                title="Exercise Form Tutorial"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK SUBMISSION MODAL */}
      <AnimatePresence>
        {showFeedbackModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden bg-zinc-950 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-violet-400" />
                  <span>Workout Feedback</span>
                </h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-1 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                    How did it feel? (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Log how reps felt, weights lifted, or general conditioning notes..."
                    className="glass-input p-3 min-h-[100px]"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="py-2.5 px-4 bg-white/5 border border-white/5 text-white/60 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-extrabold shadow-lg cursor-pointer flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Log Routine</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

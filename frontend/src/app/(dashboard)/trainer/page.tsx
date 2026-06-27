"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Scale,
  Dumbbell,
  Apple,
  User,
  Activity,
  Calendar,
  Loader,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { pageTransition, listContainer, listItem } from "@/lib/animations";
import { formatDate } from "@/lib/utils";

interface Member {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  initialWeight: number;
  initialHeight: number;
  latestWeight: number;
  latestHeight: number;
  latestBmi: number;
  lastMeasurementDate: string;
  activePlan: string;
  membershipStatus: string;
}

interface ActivityItem {
  id: string;
  type: "WORKOUT" | "DIET";
  title: string;
  description: string;
  date: string;
}

export default function TrainerDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [membersRes, activityRes] = await Promise.all([
          api.get("/api/trainer/members"),
          api.get("/api/trainer/activity"),
        ]);
        setMembers(membersRes.data);
        setActivities(activityRes.data);
      } catch (err) {
        console.error("Error loading trainer dashboard:", err);
        setError("Could not retrieve dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-medium">Opening trainer terminal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-sm rounded-2xl border border-white/5">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-semibold">{error}</p>
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Trainer <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Monitor assigned client progress, update workouts, and plan nutrition.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Members Directory */}
        <div className="xl:col-span-8 space-y-4 flex flex-col">
          {/* Controls Bar */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-3 w-full shrink-0">
            <Search className="h-4.5 w-4.5 text-white/40 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned members by name or ID..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 flex-1"
            />
          </div>

          {/* Members List */}
          <div className="flex-1 min-h-[400px]">
            {filteredMembers.length === 0 ? (
              <div className="glass-panel py-24 text-center rounded-2xl border border-white/5 space-y-3">
                <User className="h-10 w-10 text-white/20 mx-auto" />
                <p className="text-white/40 text-sm">No assigned members found matching query.</p>
              </div>
            ) : (
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredMembers.map((member) => {
                  const delta = member.latestWeight - member.initialWeight;
                  const absDelta = Math.abs(delta);

                  return (
                    <motion.div
                      key={member.id}
                      variants={listItem}
                      className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 relative group overflow-hidden"
                    >
                      <div className="absolute top-[-10%] right-[-10%] w-24 h-24 rounded-full bg-violet-600/5 blur-2xl pointer-events-none group-hover:bg-violet-600/10 transition-colors" />

                      <div className="flex gap-4">
                        {/* Avatar */}
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/30 shrink-0">
                            <User className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-white leading-tight truncate">
                            {member.name}
                          </h4>
                          <span className="font-mono text-[10px] text-white/40 mt-1 block uppercase">
                            {member.memberId}
                          </span>
                          <span className="text-[10px] bg-white/[0.03] border border-white/5 text-white/70 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                            {member.activePlan}
                          </span>
                        </div>
                      </div>

                      {/* Weight progress bar widget */}
                      <div className="my-5 space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-white/50">
                          <span>Weight delta:</span>
                          <span
                            className={`font-bold ${
                              delta < 0
                                ? "text-emerald-400"
                                : delta > 0
                                ? "text-amber-400"
                                : "text-white/40"
                            }`}
                          >
                            {delta === 0 ? "No change" : `${delta > 0 ? "+" : "-"}${absDelta.toFixed(1)} kg`}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (member.latestWeight / member.initialWeight) * 100)}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/30 font-medium">
                          <span>Initial: {member.initialWeight}kg</span>
                          <span>Latest: {member.latestWeight}kg</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-[10px] text-white/30 font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Last metrics: {formatDate(member.lastMeasurementDate)}</span>
                        </span>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Link href={`/trainer/members/${member.id}/measurements`}>
                            <button
                              className="p-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl transition-all"
                              title="Update Measurements"
                            >
                              <Scale className="h-4 w-4 text-cyan-400" />
                            </button>
                          </Link>
                          <Link href={`/trainer/members/${member.id}/workouts`}>
                            <button
                              className="p-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl transition-all"
                              title="Assign Workouts Plan"
                            >
                              <Dumbbell className="h-4 w-4 text-violet-400" />
                            </button>
                          </Link>
                          <Link href={`/trainer/members/${member.id}/diet`}>
                            <button
                              className="p-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl transition-all"
                              title="Assign Diet Schedule"
                            >
                              <Apple className="h-4 w-4 text-emerald-400" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* Client Activity logs Feed */}
        <div className="xl:col-span-4 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col max-h-[500px] xl:max-h-none overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5 shrink-0">
            <Activity className="h-4 w-4 text-violet-400" />
            <h3 className="font-bold text-sm">Assigned Clients Logs</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-12">
                No activity logged from assigned clients.
              </p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-white/40 self-start shrink-0">
                    {act.type === "WORKOUT" ? (
                      <Dumbbell className="h-3.5 w-3.5 text-violet-400" />
                    ) : (
                      <Apple className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-white/50 mt-1 leading-snug">
                      {act.description}
                    </p>
                    <span className="text-[9px] text-white/30 font-bold block mt-1 uppercase tracking-wider">
                      {formatDate(act.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

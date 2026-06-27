"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Calendar,
  User,
  Shield,
  Loader,
  AlertTriangle,
  RefreshCw,
  Award,
  Zap,
  Activity,
  Apple,
  CreditCard,
  Dumbbell,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import { pageTransition } from "@/lib/animations";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import RazorpayModal from "@/components/member/RazorpayModal";

interface MemberUser {
  email: string;
  name: string;
  memberProfile?: {
    id: string;
    memberId: string;
    name: string;
    phone?: string;
    qrCodeToken: string;
    trainer?: {
      name: string;
      specialty: string;
    } | null;
    membership?: {
      startDate: string;
      endDate: string;
      status: "ACTIVE" | "EXPIRED" | "FROZEN" | "CANCELLED";
      freezeEnd?: string | null;
      plan?: {
        name: string;
      } | null;
    } | null;
  };
}

function CircularProgressGauge({
  percent,
  label,
  color,
}: {
  percent: number;
  label: string;
  color: string;
}) {
  const radius = 36;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex-1 min-w-[100px]">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-base font-extrabold text-white">{percent}%</span>
      </div>
      <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest mt-3 text-center">
        {label}
      </span>
    </div>
  );
}

export default function MemberDashboardPage() {
  const [profile, setProfile] = useState<MemberUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);

  async function fetchProfile() {
    try {
      const response = await api.get("/api/auth/me");
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching member profile:", err);
      setError("Failed to load your member profile. Please log in again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefreshQr = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.post("/api/auth/refresh-qr");
      if (profile && profile.memberProfile) {
        setProfile({
          ...profile,
          memberProfile: {
            ...profile.memberProfile,
            qrCodeToken: res.data.qrCodeToken,
          },
        });
      }
    } catch (err) {
      console.error("Regenerating QR token failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-medium">Opening member terminal...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !profile.memberProfile) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-sm rounded-2xl border border-white/5">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-semibold">{error || "Profile data missing."}</p>
        </div>
      </div>
    );
  }

  const member = profile.memberProfile;
  const membership = member.membership;

  // Calculate days remaining
  let daysRemaining = 0;
  let isExpired = false;
  let isExpiringSoon = false;

  if (membership) {
    const endDate = new Date(membership.endDate);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    isExpired = endDate < todayStart || membership.status === "EXPIRED";
    daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
    );
    isExpiringSoon = membership.status === "ACTIVE" && daysRemaining <= 7 && daysRemaining > 0;
  } else {
    isExpired = true;
  }

  // Get dynamic status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            Active
          </span>
        );
      case "FROZEN":
        return (
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            Frozen
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            Expired
          </span>
        );
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
      {/* Alert banners */}
      <AnimatePresence>
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Your membership has expired. Renew online to resume gym access.</span>
            </div>
            <button
              onClick={() => setIsRazorpayOpen(true)}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors shrink-0"
            >
              Pay & Renew Online
            </button>
          </motion.div>
        )}

        {membership?.status === "FROZEN" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              Membership is currently frozen. Benefits will resume on{" "}
              {membership.freezeEnd ? formatDate(membership.freezeEnd) : "N/A"}.
            </span>
          </motion.div>
        )}

        {isExpiringSoon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>Your membership expires in {daysRemaining} days. Renew online to avoid lockouts.</span>
            </div>
            <button
              onClick={() => setIsRazorpayOpen(true)}
              className="px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold hover:bg-amber-600 hover:text-white transition-colors shrink-0"
            >
              Extend Subscription
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* QR Code Security Card */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[380px]">
          {/* Subtle glow border */}
          <div className="absolute top-[-30%] left-[-10%] w-[250px] h-[250px] rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

          <div>
            <h3 className="text-lg font-bold flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Digital Access Pass</span>
            </h3>
            <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mt-1">
              Check in using reception camera scanners
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 relative shadow-2xl bg-gradient-to-tr from-black to-zinc-900 shadow-[0_0_20px_rgba(124,58,237,0.1)] mt-4">
            {member.qrCodeToken ? (
              <QRCodeSVG
                value={member.qrCodeToken}
                size={180}
                bgColor="transparent"
                fgColor="#ffffff"
                level="M"
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-white/30">
                Token error.
              </div>
            )}
          </div>

          <div className="mt-4 w-full">
            <p className="font-extrabold text-white">{member.name}</p>
            <p className="font-mono text-[11px] text-white/40 mt-0.5">{member.memberId}</p>

            <button
              onClick={handleRefreshQr}
              disabled={isRefreshing}
              className="mt-4 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Regenerate QR Token</span>
            </button>
          </div>
        </div>

        {/* Membership Details & Gauges */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          {/* Membership Status Details */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Current Program
                </span>
                <h3 className="text-2xl font-black mt-1 leading-tight text-white">
                  {membership?.plan?.name || "No Plan Selected"}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(membership?.status || "EXPIRED")}
                <button
                  onClick={() => setIsRazorpayOpen(true)}
                  className="px-3 py-1.5 bg-violet-600/20 border border-violet-500 text-violet-300 rounded-lg text-xs font-bold hover:bg-violet-600 hover:text-white transition-all shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                >
                  Pay & Renew
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5 text-sm">
              <div className="space-y-1">
                <span className="text-white/40 text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-violet-400" />
                  <span>Valid Until</span>
                </span>
                <p className="font-bold text-white/90">
                  {membership ? formatDate(membership.endDate) : "N/A"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-white/40 text-xs font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Assigned Trainer</span>
                </span>
                <p className="font-bold text-white/90">
                  {member.trainer?.name || "No Trainer Assigned"}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-violet-600/10 border border-violet-500/25 flex items-center gap-3">
              <Zap className="h-5 w-5 text-violet-400 shrink-0" />
              <div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  Membership Countdown
                </span>
                <h4 className="text-base font-extrabold text-white mt-0.5">
                  {isExpired ? (
                    "0 Days Remaining"
                  ) : (
                    <>
                      {daysRemaining} <span className="text-violet-300">days left</span> in your plan
                    </>
                  )}
                </h4>
              </div>
            </div>
          </div>

          {/* Quick Metrics Gauges */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-violet-400" />
                <span>Today's Physical Tracker</span>
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                Checklist progress logs for workout completion and goals.
              </p>
            </div>

            {/* Row of Gauges */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <CircularProgressGauge
                percent={70}
                label="Workout Completion"
                color="rgb(139, 92, 246)"
              />
              <CircularProgressGauge
                percent={45}
                label="Calories Target"
                color="rgb(244, 63, 94)"
              />
              <CircularProgressGauge
                percent={90}
                label="Water Intake"
                color="rgb(6, 182, 212)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        <Link href="/member/progress">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group cursor-pointer h-full flex flex-col justify-between"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[100px] h-[100px] rounded-full bg-violet-600/10 blur-xl pointer-events-none group-hover:bg-violet-600/25 transition-all" />
            <div>
              <Activity className="h-8 w-8 text-violet-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Progress Logs</h4>
              <p className="text-white/40 text-xs mt-1">View your weight, BMI, and body measurement trends over time.</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/member/workouts">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group cursor-pointer h-full flex flex-col justify-between"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[100px] h-[100px] rounded-full bg-cyan-600/10 blur-xl pointer-events-none group-hover:bg-cyan-600/25 transition-all" />
            <div>
              <Dumbbell className="h-8 w-8 text-cyan-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Workouts</h4>
              <p className="text-white/40 text-xs mt-1">Track active routines, log progress, and check correct exercise forms.</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/member/diet">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group cursor-pointer h-full flex flex-col justify-between"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[100px] h-[100px] rounded-full bg-emerald-600/10 blur-xl pointer-events-none group-hover:bg-emerald-600/25 transition-all" />
            <div>
              <Apple className="h-8 w-8 text-emerald-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Diet Tracker</h4>
              <p className="text-white/40 text-xs mt-1">Log calorie and protein metrics. Keep updated with interactive water logs.</p>
            </div>
          </motion.div>
        </Link>

        <Link href="/member/invoices">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group cursor-pointer h-full flex flex-col justify-between"
          >
            <div className="absolute top-[-20%] right-[-10%] w-[100px] h-[100px] rounded-full bg-amber-600/10 blur-xl pointer-events-none group-hover:bg-amber-600/25 transition-all" />
            <div>
              <CreditCard className="h-8 w-8 text-amber-400 mb-4" />
              <h4 className="text-lg font-bold text-white">Receipts</h4>
              <p className="text-white/40 text-xs mt-1">Review full payment billing records and download printable PDF invoices.</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {profile && profile.memberProfile && (
        <RazorpayModal
          isOpen={isRazorpayOpen}
          onClose={() => setIsRazorpayOpen(false)}
          memberId={profile.memberProfile.id}
          memberName={profile.memberProfile.name}
          memberEmail={profile.email}
          memberPhone={profile.memberProfile.phone || ""}
          onSuccess={fetchProfile}
        />
      )}
    </motion.div>
  );
}

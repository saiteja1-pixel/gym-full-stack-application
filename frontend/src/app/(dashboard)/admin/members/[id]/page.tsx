"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  Award,
  Clock,
  Dumbbell,
  Scale,
  DollarSign,
  QrCode,
  Snowflake,
  RefreshCw,
  Loader
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { pageTransition } from "@/lib/animations";
import { formatDate } from "@/lib/utils";
import FreezeModal from "@/components/admin/FreezeModal";
import RenewModal from "@/components/admin/RenewModal";

interface MemberProfile {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  emergencyContact: string;
  avatarUrl: string | null;
  idProofUrl: string | null;
  qrCodeToken: string;
  initialHeight: number;
  initialWeight: number;
  trainer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  membership: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    remainingFreezeDays: number;
    plan: {
      id: string;
      name: string;
      price: number;
      freezeDays: number;
    };
  } | null;
  bodyMeasurements: {
    id: string;
    logDate: string;
    weight: number;
    height: number;
    bmi: number;
    bodyFat: number | null;
  }[];
  payments: {
    id: string;
    invoiceNumber: string;
    amountPaid: number;
    totalAmount: number;
    paymentDate: string;
    status: string;
  }[];
  user: {
    email: string;
  };
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/admin/members/${memberId}`);
      setMember(response.data);
    } catch (err: any) {
      setError("Failed to load member profile.");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 rounded-2xl border border-rose-500/20 text-rose-400">
        <p className="font-bold">{error || "Member profile not found."}</p>
        <button onClick={() => router.push("/admin/members")} className="btn-primary mt-4 py-2 px-4 rounded-xl text-xs">
          Return to directory
        </button>
      </div>
    );
  }

  const membershipStatus = member.membership?.status || "EXPIRED";
  const plan = member.membership?.plan;

  // Calculate days remaining
  let daysRemaining = 0;
  if (member.membership?.endDate) {
    const end = new Date(member.membership.endDate).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "ACTIVE": return "badge-active";
      case "FROZEN": return "badge-frozen";
      case "CANCELLED": return "badge-expired";
      default: return "badge-expired";
    }
  };

  const getGenderLabel = (g: string) => {
    switch (g) {
      case "MALE": return "Male";
      case "FEMALE": return "Female";
      default: return "Other";
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
      {/* Back button */}
      <Link href="/admin/members" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to directory
      </Link>

      {/* Header Profile summary */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-[-30%] right-[-10%] w-[250px] h-[250px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative flex-shrink-0 shadow-lg shadow-violet-500/5">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-white/20" />
            )}
          </div>

          <div className="text-center md:text-left space-y-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{member.name}</h1>
              <span className={`inline-block w-fit px-2.5 py-1 text-xs ${getStatusClass(membershipStatus)}`}>
                {membershipStatus}
              </span>
            </div>
            <p className="text-xs text-violet-400 font-mono tracking-wider">{member.memberId}</p>
            <p className="text-xs text-white/40">Registered: {formatDate(member.dob)}</p>
          </div>
        </div>

        {/* Quick actions buttons */}
        <div className="flex gap-2.5 w-full md:w-auto">
          {membershipStatus === "ACTIVE" && (
            <button
              onClick={() => setFreezeOpen(true)}
              className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-xs font-semibold text-amber-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <Snowflake className="w-4 h-4" /> Freeze
            </button>
          )}
          <button
            onClick={() => setRenewOpen(true)}
            className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/20 text-xs font-semibold text-violet-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Renew
          </button>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/30" />
                <div>
                  <span className="text-[10px] text-white/40 block">Email Address</span>
                  <span className="text-white font-medium">{member.user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/30" />
                <div>
                  <span className="text-[10px] text-white/40 block">Phone Number</span>
                  <span className="text-white font-medium">{member.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-white/30" />
                <div>
                  <span className="text-[10px] text-white/40 block">Gender & Age</span>
                  <span className="text-white font-medium">{getGenderLabel(member.gender)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-white/30" />
                <div>
                  <span className="text-[10px] text-white/40 block">Emergency Contact</span>
                  <span className="text-white font-medium">{member.emergencyContact}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Measurements History */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4 flex items-center justify-between">
              <span>Body Measurement Logs</span>
              <span className="text-xs text-white/30 font-medium">Initial: {member.initialHeight}cm / {member.initialWeight}kg</span>
            </h3>
            {member.bodyMeasurements.length === 0 ? (
              <p className="text-sm text-white/30 py-4 text-center">No physical baseline records logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40">
                      <th className="py-2">Date</th>
                      <th className="py-2">Weight (kg)</th>
                      <th className="py-2">Height (cm)</th>
                      <th className="py-2">BMI</th>
                      <th className="py-2">Body Fat (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {member.bodyMeasurements.map((m) => (
                      <tr key={m.id} className="border-b border-white/[0.02]">
                        <td className="py-2 text-white/60">{formatDate(m.logDate)}</td>
                        <td className="py-2 font-semibold text-white">{m.weight} kg</td>
                        <td className="py-2 text-white/60">{m.height} cm</td>
                        <td className="py-2 text-white/60">{m.bmi}</td>
                        <td className="py-2 text-white/60">{m.bodyFat ? `${m.bodyFat}%` : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 column subscription & logs */}
        <div className="space-y-6">
          {/* Subscription Info Card */}
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-600/[0.02] to-cyan-500/[0.01] relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] w-[100px] h-[100px] bg-violet-600/10 blur-xl pointer-events-none" />
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-violet-400" /> Subscription Plan
            </h3>

            {member.membership ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-white/40 block">Active Plan Name</span>
                  <span className="text-base font-extrabold text-white mt-0.5 block">{plan?.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-white/40 block">Start Date</span>
                    <span className="text-white font-medium">{formatDate(member.membership.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Expiry Date</span>
                    <span className="text-white font-medium">{formatDate(member.membership.endDate)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span className="text-[10px] text-white/40">Remaining Days</span>
                    <span className="text-lg font-extrabold text-white block leading-none mt-1">{daysRemaining} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Remaining Freezes</span>
                    <span className="text-sm font-semibold text-amber-400 block text-right mt-1">{member.membership.remainingFreezeDays} days</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/30 py-4">No active membership plan configured.</p>
            )}
          </div>

          {/* Assigned Trainer */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-cyan-400" /> Personal Trainer
            </h3>
            {member.trainer ? (
              <div className="flex items-center gap-3 text-xs">
                <div className="w-10 h-10 rounded-full bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  {member.trainer.name[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">Assigned Coach</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{member.trainer.name}</span>
                  <span className="text-white/40 mt-0.5 block">{member.trainer.phone}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30 py-2">No personal trainer assigned for this athlete.</p>
            )}
          </div>

          {/* Latest Payment Transaction */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Payment Ledger (Last 3)
            </h3>
            {member.payments.length === 0 ? (
              <p className="text-xs text-white/30 py-2 text-center">No payment transactions recorded.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {member.payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl border border-white/[0.02] bg-white/[0.01]">
                    <div>
                      <span className="font-mono text-white/80">{p.invoiceNumber}</span>
                      <span className="text-[10px] text-white/30 block mt-0.5">{formatDate(p.paymentDate)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">₹{p.amountPaid}</span>
                      <span className="text-[9px] block text-emerald-400 font-semibold">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Freeze Confirmation modal */}
      {member.membership && (
        <FreezeModal
          isOpen={freezeOpen}
          onClose={() => setFreezeOpen(false)}
          memberId={member.id}
          memberName={member.name}
          maxFreezeDays={member.membership.remainingFreezeDays}
          onSuccess={fetchProfile}
        />
      )}

      {/* Renew Confirmation modal */}
      <RenewModal
        isOpen={renewOpen}
        onClose={() => setRenewOpen(false)}
        memberId={member.id}
        memberName={member.name}
        onSuccess={fetchProfile}
      />
    </motion.div>
  );
}

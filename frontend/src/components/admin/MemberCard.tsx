"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { User, Calendar, Phone, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { listItem } from "@/lib/animations";

export interface Member {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  membership?: {
    status: string;
    endDate: string;
    plan: {
      name: string;
    };
  } | null;
  trainer?: {
    name: string;
  } | null;
}

interface MemberCardProps {
  member: Member;
}

export default function MemberCard({ member }: MemberCardProps) {
  const status = member.membership?.status || "EXPIRED";
  const planName = member.membership?.plan?.name || "No Active Plan";
  const expiryDate = member.membership?.endDate ? formatDate(member.membership.endDate) : "N/A";

  const getStatusClass = (status: string) => {
    switch (status) {
      case "ACTIVE": return "badge-active";
      case "FROZEN": return "badge-frozen";
      case "CANCELLED": return "badge-expired";
      default: return "badge-expired";
    }
  };

  return (
    <motion.div
      variants={listItem}
      className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-[220px]"
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white/40" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-white/40">{member.memberId}</span>
            <span className={getStatusClass(status)}>{status}</span>
          </div>
          <h4 className="text-base font-bold text-white mt-1 truncate hover:text-violet-400 transition-colors">
            <Link href={`/admin/members/${member.id}`}>{member.name}</Link>
          </h4>
          <p className="text-xs text-violet-400 font-medium truncate mt-0.5">{planName}</p>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-white/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
          <span className="truncate">{member.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0 justify-end">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-white/30" />
          <span className="truncate">{expiryDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/admin/members/${member.id}`}
          className="flex-1 py-1.5 px-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-all text-center border border-violet-500/10"
        >
          View Profile
        </Link>
      </div>
    </motion.div>
  );
}

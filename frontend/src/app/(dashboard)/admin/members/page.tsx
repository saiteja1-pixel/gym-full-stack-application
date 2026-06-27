"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Loader, Users, Phone, Calendar, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import MemberCard, { Member } from "@/components/admin/MemberCard";
import { pageTransition, listContainer } from "@/lib/animations";
import { formatDate } from "@/lib/utils";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/admin/members", {
        params: {
          search: debouncedSearch,
          status: statusFilter,
          page,
          limit: 9
        }
      });
      setMembers(response.data.members);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (err: any) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Reset page on search or filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

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
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Member <span className="gradient-text">Directory</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">Manage physical baseline logs, plans, and profiles.</p>
        </div>
        <Link href="/admin/members/new" className="self-start sm:self-auto">
          <button className="btn-primary flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm w-full">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </Link>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by ID, name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {["ALL", "ACTIVE", "FROZEN", "EXPIRED", "CANCELLED"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {filter.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs text-white/40">Showing {members.length} of {totalCount} registered members</p>

      {/* Members List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 text-violet-400 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/5">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No Members Found</h3>
          <p className="text-sm text-white/40 mt-1 mb-6">No records match the current filters.</p>
          <Link href="/admin/members/new">
            <button className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 mx-auto">
              <UserPlus className="w-4 h-4" /> Register Member
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Card Grid (Responsive layout) */}
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-white/5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              >
                Previous
              </button>
              <span className="text-xs text-white/50">
                Page <span className="text-white font-bold">{page}</span> of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

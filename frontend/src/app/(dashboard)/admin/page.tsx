"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  Calendar,
  Activity,
  ArrowRight,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Loader,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "@/lib/api";
import { pageTransition, listContainer, listItem } from "@/lib/animations";
import { formatCurrency, timeAgo } from "@/lib/utils";
import AnalyticsCard from "@/components/admin/AnalyticsCard";

interface DashboardData {
  stats: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    frozenMembers: number;
    upcomingRenewals: number;
    todayCheckIns: number;
    monthlyRevenue: number;
    pendingPayments: number;
  };
  monthlyRevenueTrend: Array<{ month: string; revenue: number }>;
  membershipDistribution: Array<{ name: string; value: number }>;
  recentActivity: Array<{
    id: string;
    type: "REGISTRATION" | "CHECK_IN" | "PAYMENT";
    title: string;
    description: string;
    date: string;
  }>;
}

const PIE_COLORS = {
  Active: "#10b981", // Emerald
  Expired: "#f43f5e", // Rose
  Frozen: "#f59e0b", // Amber
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await api.get("/api/admin/dashboard-stats");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const CustomGlassTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 border border-white/10 rounded-lg shadow-2xl backdrop-blur-md">
          <p className="text-white/60 text-xs mb-1 font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm font-bold"
              style={{ color: entry.color || "hsl(var(--primary))" }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "REGISTRATION":
        return <UserPlus className="h-5 w-5 text-violet-400" />;
      case "CHECK_IN":
        return <CheckCircle2 className="h-5 w-5 text-cyan-400" />;
      case "PAYMENT":
        return <CreditCard className="h-5 w-5 text-emerald-400" />;
      default:
        return <Activity className="h-5 w-5 text-white/50" />;
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/60 text-sm font-medium">Analyzing database terminal...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-md rounded-2xl border border-white/5">
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Data Load Failed</h3>
          <p className="text-white/60 text-sm mb-4">
            Could not retrieve analytics data. Verify that your API server and database are running correctly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary py-2 px-4 rounded-xl text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { stats, monthlyRevenueTrend, membershipDistribution, recentActivity } = data;

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            System <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Real-time business insights and terminal statistics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/scan">
            <button className="btn-primary flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium">
              Open Check-In Scanner
            </button>
          </Link>
          <Link href="/admin/payments">
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors">
              Record Invoices
            </button>
          </Link>
        </div>
      </div>

      {/* Row of 7 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <AnalyticsCard
          title="Total Members"
          value={stats.totalMembers}
          glowColor="purple"
          icon={Users}
        />
        <AnalyticsCard
          title="Active Members"
          value={stats.activeMembers}
          glowColor="emerald"
          icon={Users}
        />
        <AnalyticsCard
          title="Expired Members"
          value={stats.expiredMembers}
          glowColor="rose"
          icon={Users}
        />
        <AnalyticsCard
          title="Upcoming Renewals"
          value={stats.upcomingRenewals}
          glowColor="amber"
          icon={Calendar}
        />
        <AnalyticsCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          glowColor="cyan"
          icon={Activity}
        />
        <AnalyticsCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          glowColor="purple"
          icon={CreditCard}
        />
        <AnalyticsCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          glowColor="rose"
          icon={CreditCard}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line / Area Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Revenue Trend</h3>
              <p className="text-xs text-white/40 mt-0.5">Subscription billing over time</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Revenue Growth</span>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyRevenueTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(124, 58, 237)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="rgb(124, 58, 237)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip content={<CustomGlassTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="rgb(139, 92, 246)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col h-[400px]">
          <div>
            <h3 className="text-lg font-bold">Membership Status</h3>
            <p className="text-xs text-white/40 mt-0.5">Current plan status distribution</p>
          </div>
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {membershipDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || "#ffffff"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-2.5 border border-white/10 rounded-lg shadow-xl backdrop-blur-md text-xs font-semibold">
                          <span style={{ color: payload[0].color }}>
                            {payload[0].name}: {payload[0].value} members
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold tracking-tight">
                {stats.activeMembers}
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                Active Now
              </span>
            </div>
          </div>
          {/* Custom Legends */}
          <div className="flex justify-center items-center gap-4 text-xs font-medium pb-2">
            {membershipDistribution.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{
                    backgroundColor: PIE_COLORS[entry.name as keyof typeof PIE_COLORS],
                  }}
                />
                <span className="text-white/60">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-lg font-bold">Recent Activity</h3>
            <p className="text-xs text-white/40 mt-0.5">Latest 10 updates from the gym terminal</p>
          </div>

          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-white/5 space-y-3"
          >
            {recentActivity.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">
                No activity recorded in the current terminal cycle.
              </p>
            ) : (
              recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  variants={listItem}
                  className="flex items-start gap-4 pt-3 first:pt-0"
                >
                  <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white/95 leading-tight">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-white/50 mt-1 leading-snug">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider whitespace-nowrap pt-1">
                    {timeAgo(activity.date)}
                  </span>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">Quick Actions</h3>
              <p className="text-xs text-white/40 mt-0.5">Frequently accessed administrative pages</p>
            </div>
            <div className="space-y-2">
              <Link
                href="/admin/members/new"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-sm group"
              >
                <span>Register a New Member</span>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </Link>
              <Link
                href="/admin/payments"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-sm group"
              >
                <span>Log a Member Payment</span>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </Link>
              <Link
                href="/admin/memberships"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-sm group"
              >
                <span>Modify Membership Plans</span>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-sm group"
              >
                <span>Export Audit Reports</span>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5 mt-6 text-center text-xs text-white/30 font-medium">
            Core Fit Club terminal version 1.0.3
          </div>
        </div>
      </div>
    </motion.div>
  );
}

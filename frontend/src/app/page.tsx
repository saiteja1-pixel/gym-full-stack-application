"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Dumbbell, Shield, Users, ArrowRight, Zap, Activity, Star } from "lucide-react";
import { pageTransition, listContainer, listItem } from "@/lib/animations";

const portals = [
  {
    role: "ADMIN",
    title: "Admin Portal",
    description:
      "Full control over members, memberships, payments, attendance scanning, and business analytics.",
    icon: Shield,
    gradient: "from-violet-600 to-purple-700",
    glow: "rgba(124, 58, 237, 0.4)",
    features: ["Member Management", "Revenue Analytics", "QR Attendance", "Reports & Export"],
    href: "/login?role=ADMIN",
  },
  {
    role: "TRAINER",
    title: "Trainer Portal",
    description:
      "Manage your assigned members' fitness journey — workouts, diet plans, and body measurements.",
    icon: Dumbbell,
    gradient: "from-cyan-600 to-teal-600",
    glow: "rgba(14, 116, 144, 0.4)",
    features: ["Workout Builder", "Diet Planner", "Body Metrics", "Progress Tracking"],
    href: "/login?role=TRAINER",
  },
  {
    role: "MEMBER",
    title: "Member Portal",
    description:
      "Your personal fitness hub — view your QR code, track progress, follow workouts, and log nutrition.",
    icon: Users,
    gradient: "from-emerald-600 to-green-600",
    glow: "rgba(16, 185, 129, 0.4)",
    features: ["QR Check-In", "Workout Tracker", "Diet Logger", "Progress Charts"],
    href: "/login?role=MEMBER",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full bg-accent-purple pointer-events-none opacity-50" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-accent-cyan pointer-events-none opacity-40" />
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-accent-purple pointer-events-none opacity-20 -translate-x-1/2" />

      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        className="relative z-10 min-h-screen flex flex-col"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 lg:px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-wider">
              <span className="gradient-text">CORE</span>
              <span className="text-cyan-400">FIT</span>
              <span className="text-white/40 font-normal text-sm ml-2">CLUB</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>System Online</span>
          </div>
        </header>

        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5">
              <Star className="h-3 w-3" />
              Premium Gym Management System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl"
          >
            Elevate Your{" "}
            <span className="gradient-text-primary">Fitness Empire</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-white/50 text-lg max-w-2xl mb-4"
          >
            A complete gym management platform for owners, trainers, and members.
            Manage memberships, track fitness progress, scan QR attendance, and grow
            your fitness business.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-6 text-sm text-white/30 mb-16"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-amber-400" /> QR Check-In
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400" /> Progress Tracking
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="h-3 w-3 text-violet-400" /> Smart Analytics
            </span>
          </motion.div>

          {/* Portal Cards */}
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
          >
            {portals.map((portal) => (
              <motion.div key={portal.role} variants={listItem}>
                <Link href={portal.href}>
                  <motion.div
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.99 }}
                    className="glass-card p-6 text-left cursor-pointer group relative overflow-hidden h-full"
                    style={{ "--glow": portal.glow } as React.CSSProperties}
                  >
                    {/* Card Glow */}
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-500"
                      style={{ backgroundColor: portal.glow }}
                    />

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${portal.gradient} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <portal.icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                      {portal.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/50 text-sm leading-relaxed mb-5">
                      {portal.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-1.5 mb-6">
                      {portal.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-white/40"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${portal.gradient}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div
                      className={`flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${portal.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}
                    >
                      Enter Portal
                      <ArrowRight className={`h-4 w-4 bg-gradient-to-r ${portal.gradient} text-transparent`} style={{ color: portal.glow.replace('0.4', '1') }} />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-white/20 text-xs">
          Core Fit Club © {new Date().getFullYear()} — Gym Membership Management System
        </footer>
      </motion.div>
    </div>
  );
}

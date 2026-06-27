"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dumbbell, Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-purple pointer-events-none opacity-40 z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-cyan pointer-events-none opacity-30 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-panel p-8 md:p-12 rounded-3xl border border-white/5 max-w-md w-full text-center relative z-10 backdrop-blur-xl bg-white/[0.01] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Brand/logo badge */}
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-[0_0_20px_rgba(124,58,237,0.4)] mb-6 animate-pulse">
          <Dumbbell className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-8xl font-extrabold tracking-tight text-white mb-2 font-mono">
          <span className="gradient-text">404</span>
        </h1>
        
        <h2 className="text-xl font-bold text-white/90 mb-4">
          Lost in the Gym?
        </h2>
        
        <p className="text-sm text-white/40 mb-8 leading-relaxed">
          The workout routine or page you are searching for does not exist. It might have been relocated, renamed, or completed!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="w-full">
            <button className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all">
              <Home className="h-4 w-4" />
              Return Home
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

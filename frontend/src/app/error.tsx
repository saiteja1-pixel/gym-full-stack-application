"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error details for diagnostics
    console.error("Next.js Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-purple pointer-events-none opacity-40 z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-cyan pointer-events-none opacity-30 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 md:p-12 rounded-3xl border border-white/5 max-w-md w-full text-center relative z-10 backdrop-blur-xl bg-white/[0.01] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Warning Badge */}
        <div className="inline-flex p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)] mb-6">
          <AlertTriangle className="h-8 w-8 text-rose-500 animate-bounce" />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Something went wrong
        </h1>
        
        <p className="text-sm text-white/40 mb-6 leading-relaxed">
          An unexpected error occurred during rendering. The gym application state could not load cleanly.
        </p>

        {error.message && (
          <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl mb-8 text-left">
            <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Diagnostics</span>
            <p className="text-xs font-mono text-white/60 select-all break-words leading-relaxed">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          
          <Link href="/" className="w-full">
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, Eye, EyeOff, LogIn, Shield, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { pageTransition } from "@/lib/animations";
import Link from "next/link";

const roleConfig = {
  ADMIN: {
    label: "Admin / Owner",
    icon: Shield,
    color: "text-violet-400",
    glow: "rgba(124, 58, 237, 0.3)",
    gradient: "from-violet-600 to-purple-700",
  },
  SUPER_ADMIN: {
    label: "Super Admin",
    icon: Shield,
    color: "text-violet-400",
    glow: "rgba(124, 58, 237, 0.3)",
    gradient: "from-violet-600 to-purple-700",
  },
  TRAINER: {
    label: "Fitness Trainer",
    icon: Dumbbell,
    color: "text-cyan-400",
    glow: "rgba(14, 116, 144, 0.3)",
    gradient: "from-cyan-600 to-teal-600",
  },
  MEMBER: {
    label: "Member",
    icon: Users,
    color: "text-emerald-400",
    glow: "rgba(16, 185, 129, 0.3)",
    gradient: "from-emerald-600 to-green-600",
  },
};

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get("role") as keyof typeof roleConfig | null;
  const config = roleConfig[roleParam || "ADMIN"] || roleConfig.ADMIN;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-purple pointer-events-none opacity-50" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-cyan pointer-events-none opacity-30" />

      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-[0_0_20px_rgba(124,58,237,0.5)]">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-wider">
              <span className="gradient-text">CORE</span>
              <span className="text-cyan-400">FIT</span>
            </span>
          </Link>

          {/* Role Badge */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className={`p-1.5 rounded-lg bg-gradient-to-tr ${config.gradient}`}
            >
              <IconComponent className="h-4 w-4 text-white" />
            </div>
            <span className={`text-sm font-semibold ${config.color}`}>
              {config.label} Login
            </span>
          </div>
          <p className="text-white/40 text-sm">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Role Tabs Switcher */}
        <div className="flex items-center justify-center p-1 rounded-xl bg-white/5 border border-white/10 mb-6 max-w-xs mx-auto relative z-20">
          {(["ADMIN", "TRAINER", "MEMBER"] as const).map((r) => {
            const isActive = (roleParam || "ADMIN") === r;
            const rConfig = roleConfig[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  router.push(`/login?role=${r}`);
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-tr ${rConfig.gradient} text-white shadow-md`
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {r === "ADMIN" ? "Admin" : r === "TRAINER" ? "Trainer" : "Member"}
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <div
          className="glass-card p-8 relative overflow-hidden"
          style={{ boxShadow: `0 0 40px ${config.glow}` }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] pointer-events-none opacity-30"
            style={{ backgroundColor: config.glow.replace("0.3", "1") }}
          />

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-input"
                autoComplete="email"
                disabled={isLoading}
                id="login-email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pr-12"
                  autoComplete="current-password"
                  disabled={isLoading}
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3 text-rose-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                isLoading
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer"
              } bg-gradient-to-r ${config.gradient} text-white shadow-lg`}
              style={{ boxShadow: `0 0 20px ${config.glow}` }}
              id="login-submit-btn"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Back to portal selector */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-white/30 hover:text-white/60 text-sm transition-colors"
          >
            ← Back to portal selection
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader, Shield, User, Star, Phone, Info, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { pageTransition, listContainer, listItem } from "@/lib/animations";

interface Trainer {
  id: string;
  name: string;
  phone: string;
  specialty: string | null;
  bio: string | null;
}

export default function TrainersManagementPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/admin/trainers");
      setTrainers(response.data);
    } catch (err: any) {
      setError("Failed to load trainers list.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSpecialty("");
    setBio("");
    setError("");
    setSuccess("");
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!name || !email || !phone || !password) {
      setError("Name, Email, Phone, and Password are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/api/admin/trainers", {
        name,
        email,
        phone,
        password,
        specialty: specialty || undefined,
        bio: bio || undefined,
      });

      setSuccess("Trainer registered successfully!");
      setDrawerOpen(false);
      fetchTrainers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create trainer profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 relative"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Trainers <span className="gradient-text">Management</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Register and manage fitness coaches in the gym ecosystem.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 bg-gradient-to-tr from-violet-600 to-cyan-500 hover:opacity-90 text-white rounded-xl font-bold text-xs shadow-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Trainer</span>
        </button>
      </div>

      {loading && trainers.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Loader className="h-8 w-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-medium">Fetching registered coaches...</p>
        </div>
      ) : error && trainers.length === 0 ? (
        <div className="glass-panel p-8 text-center max-w-md mx-auto rounded-2xl border border-rose-500/10">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/85 text-sm font-semibold">{error}</p>
        </div>
      ) : trainers.length === 0 ? (
        <div className="glass-panel py-20 text-center rounded-2xl border border-white/5 space-y-4">
          <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 inline-flex text-white/20">
            <User className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No Trainers Found</h3>
            <p className="text-white/40 text-sm max-w-xs mx-auto mt-1">
              Add a trainer profile to assign members and start plotting nutrition plans.
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {trainers.map((t) => (
            <motion.div
              key={t.id}
              variants={listItem}
              className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300"
            >
              <div className="absolute top-[-10%] right-[-10%] w-20 h-20 rounded-full bg-cyan-600/5 blur-2xl pointer-events-none group-hover:bg-cyan-600/10 transition-colors" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/30 shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-lg text-white leading-snug truncate">
                    {t.name}
                  </h3>
                  {t.specialty && (
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full inline-block mt-1 font-bold border border-cyan-500/20 uppercase tracking-wider">
                      {t.specialty}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 text-xs text-white/50 space-y-1 font-medium">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-white/30" />
                  <span>{t.phone}</span>
                </p>
                {t.bio && (
                  <p className="flex items-start gap-2 pt-2 italic text-white/40 leading-relaxed font-normal">
                    <Info className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
                    <span>{t.bio}</span>
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* DRAWER FOR ADDING NEW TRAINER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0d0d10] border-l border-white/10 z-50 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl"
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Plus className="w-5 h-5 text-violet-400" />
                    <span>Register New Trainer</span>
                  </h3>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs font-semibold mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Trainer Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mike Tyson"
                      className="glass-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. mike@corefit.com"
                      className="glass-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543215"
                      className="glass-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Portal Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter unique password"
                      className="glass-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Specialty Focus (Optional)
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Bodybuilding, Strength training"
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                      Coach Biography (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief details about credentials, degrees or certifications..."
                      className="glass-input p-3"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="flex-1 py-3 bg-white/5 border border-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-gradient-to-tr from-violet-600 to-cyan-500 hover:opacity-90 text-white rounded-xl text-xs font-extrabold shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Profile</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

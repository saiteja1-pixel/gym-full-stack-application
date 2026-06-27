"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader, Camera, Upload, ArrowLeft, ArrowRight, Check, Dumbbell, User, Award, Shield, FileText } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import QRGeneratedModal from "@/components/admin/QRGeneratedModal";
import { pageTransition } from "@/lib/animations";

export default function RegisterMemberPage() {
  const router = useRouter();

  // Multi-step state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal success state
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdMember, setCreatedMember] = useState({
    memberId: "",
    name: "",
    qrCodeToken: ""
  });

  // DB options loaded from API
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [plans, setPlans] = useState<{ id: string; name: string; price: number; durationDays: number }[]>([]);

  // Step 1: Personal Info Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("MALE");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Step 2: Baselines & Assignments
  const [initialHeight, setInitialHeight] = useState("");
  const [initialWeight, setInitialWeight] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [planId, setPlanId] = useState("");

  // Step 3: Documents
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofName, setIdProofName] = useState("");

  // Webcam states
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [trainersRes, plansRes] = await Promise.all([
        api.get("/api/admin/trainers"),
        api.get("/api/admin/membership-plans")
      ]);
      setTrainers(trainersRes.data);
      const activePlans = plansRes.data.filter((p: any) => p.isActive);
      setPlans(activePlans);
      if (activePlans.length > 0) {
        setPlanId(activePlans[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load options:", err);
    }
  };

  // Webcam controls
  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Webcam access error:", err);
      alert("Could not access camera. Please select file upload instead.");
      setShowWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "avatar_capture.jpg", { type: "image/jpeg" });
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
          }
        }, "image/jpeg");
      }
      stopWebcam();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofFile(file);
      setIdProofName(file.name);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (!name || !email || !phone || !dob || !emergencyContact) {
        setError("All personal fields are required.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!initialHeight || !initialWeight || !planId) {
        setError("Physical baselines and plan selection are required.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmitRegistration = async () => {
    setLoading(true);
    setError("");
    stopWebcam();

    try {
      let avatarUrl = "";
      let idProofUrl = "";

      // 1. Upload Avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await api.post("/api/upload/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        avatarUrl = uploadRes.data.url;
      }

      // 2. Upload ID Proof if selected
      if (idProofFile) {
        const formData = new FormData();
        formData.append("file", idProofFile);
        const uploadRes = await api.post("/api/upload/id-proof", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        idProofUrl = uploadRes.data.url;
      }

      // 3. Register member
      const memberPayload = {
        name,
        email,
        phone,
        dob,
        gender,
        emergencyContact,
        initialHeight: parseFloat(initialHeight),
        initialWeight: parseFloat(initialWeight),
        trainerId: trainerId || undefined,
        planId,
        avatarUrl: avatarUrl || undefined,
        idProofUrl: idProofUrl || undefined
      };

      const response = await api.post("/api/admin/members", memberPayload);

      // 4. Success -> set modal data and open it
      setCreatedMember({
        memberId: response.data.member.memberId,
        name: response.data.member.name,
        qrCodeToken: response.data.member.qrCodeToken
      });
      setSuccessModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Back to list */}
      <Link href="/admin/members" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to directory
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Member <span className="gradient-text font-bold">Registration</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">Enroll a new athlete in Core Fit Club.</p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              s <= step ? "bg-gradient-to-r from-violet-600 to-cyan-500" : "bg-white/5"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Forms Container */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
        {/* Step 1 — Personal Information */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4">Step 1: Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="glass-input text-white/60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="glass-input cursor-pointer"
                >
                  <option value="MALE" className="bg-[#09090b]">Male</option>
                  <option value="FEMALE" className="bg-[#09090b]">Female</option>
                  <option value="OTHER" className="bg-[#09090b]">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Emergency Contact</label>
                <input
                  type="text"
                  required
                  placeholder="Name — Relation — Phone"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-1.5 py-3 px-6 rounded-xl text-sm"
              >
                Next Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2 — Baselines & Assignments */}
        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2 mb-4">Step 2: baseline metrics & subscriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Initial Height (cm)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min={30}
                  max={250}
                  placeholder="e.g. 178.5"
                  value={initialHeight}
                  onChange={(e) => setInitialHeight(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Initial Weight (kg)</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min={10}
                  max={300}
                  placeholder="e.g. 82.0"
                  value={initialWeight}
                  onChange={(e) => setInitialWeight(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Assign Personal Trainer</label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="glass-input cursor-pointer"
                >
                  <option value="" className="bg-[#09090b]">No Trainer Assigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#09090b]">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Membership Plan</label>
                <select
                  value={planId}
                  required
                  onChange={(e) => setPlanId(e.target.value)}
                  className="glass-input cursor-pointer"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#09090b]">
                      {p.name} (₹{p.price} / {p.durationDays} days)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors border border-white/10"
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-1.5 py-3 px-6 rounded-xl text-sm"
              >
                Next Documents <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — Documents */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2">Step 3: Verification Documents</h3>

            {/* Profile Avatar Webcam/Upload */}
            <div className="space-y-3">
              <label className="text-xs text-white/60 font-medium block">Profile Photo</label>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Photo Preview / Webcam view */}
                <div className="w-44 h-44 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden relative">
                  {showWebcam ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-white/20" />
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2 w-full md:w-auto">
                  {showWebcam ? (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Capture Photo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4" /> Take Picture (Webcam)
                    </button>
                  )}

                  {showWebcam && (
                    <button
                      type="button"
                      onClick={stopWebcam}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-semibold text-rose-400 border border-rose-500/20 transition-colors"
                    >
                      Cancel Camera
                    </button>
                  )}

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-4 h-4" /> Upload Avatar File
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ID Proof */}
            <div className="space-y-3 pt-2">
              <label className="text-xs text-white/60 font-medium block">Verification ID Proof (PDF / Image)</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleIdProofChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border border-dashed border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.02] p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
                  <Upload className="w-6 h-6 text-white/30" />
                  {idProofName ? (
                    <span className="text-xs text-emerald-400 font-semibold truncate max-w-[250px]">
                      {idProofName}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-white/60">Drag and drop file here, or click to browse</span>
                      <span className="text-[10px] text-white/30">Supports PDF, PNG, JPG up to 5MB</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-white/5">
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-3 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors border border-white/10"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitRegistration}
                className="btn-primary py-3 px-8 rounded-xl flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : "Complete Registration"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Output success modal */}
      <QRGeneratedModal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          router.push("/admin/members");
        }}
        memberId={createdMember.memberId}
        memberName={createdMember.name}
        qrCodeToken={createdMember.qrCodeToken}
      />
    </motion.div>
  );
}

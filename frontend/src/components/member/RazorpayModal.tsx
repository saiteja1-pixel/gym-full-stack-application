"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, X, Loader, Sparkles, CheckCircle } from "lucide-react";
import { slideUp, fadeInOut } from "@/lib/animations";
import api from "@/lib/api";
import axios from "axios";

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  gstPercent: number;
}

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  onSuccess: () => void;
}

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

export default function RazorpayModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  memberEmail,
  memberPhone,
  onSuccess,
}: RazorpayModalProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  // Load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setError("");
    try {
      const response = await api.get("/api/admin/membership-plans");
      const activePlans = response.data.filter((p: MembershipPlan) => p.isActive);
      setPlans(activePlans);
      if (activePlans.length > 0) {
        setSelectedPlanId(activePlans[0].id);
      }
    } catch (err: any) {
      setError("Failed to fetch active membership plans.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const tax = selectedPlan ? (selectedPlan.price * (selectedPlan.gstPercent || 18)) / 100 : 0;
  const total = selectedPlan ? selectedPlan.price + tax : 0;

  const handlePayment = async () => {
    if (!selectedPlanId) {
      setError("Please select a valid membership plan.");
      return;
    }

    setCheckingOut(true);
    setError("");

    try {
      // 1. Load Razorpay library
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Check internet connection.");
      }

      // 2. Fetch order creation details from FastAPI backend
      const orderResponse = await axios.post(`${FASTAPI_URL}/api/payments/razorpay/order`, {
        memberId: memberId,
        planId: selectedPlanId,
      });

      const orderData = orderResponse.data;

      // 3. Configure Razorpay parameters
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Core Fit Club",
        description: `Plan: ${orderData.planName} (${selectedPlan?.durationDays} days)`,
        order_id: orderData.id,
        handler: async function (response: any) {
          // Signature verification request
          setCheckingOut(true);
          try {
            const verifyRes = await axios.post(`${FASTAPI_URL}/api/payments/razorpay/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              memberId: memberId,
              planId: selectedPlanId,
            });

            if (verifyRes.data.status === "success") {
              onSuccess();
              onClose();
            } else {
              setError("Signature verification failed.");
            }
          } catch (verifyErr: any) {
            setError(verifyErr.response?.data?.detail || "Verification failed. Check transaction history.");
          } finally {
            setCheckingOut(false);
          }
        },
        prefill: {
          name: memberName,
          email: memberEmail,
          contact: memberPhone,
        },
        theme: {
          color: "#7c3aed", // Brand violet
        },
        modal: {
          ondismiss: function () {
            setCheckingOut(false);
          },
        },
      };

      const paymentWindow = new (window as any).Razorpay(options);
      paymentWindow.open();
    } catch (err: any) {
      console.error("[Razorpay] Checkout Error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to start Razorpay payment.");
      setCheckingOut(false);
    }
  };

  const handleDemoPayment = async () => {
    if (!selectedPlanId) {
      setError("Please select a valid membership plan.");
      return;
    }

    setCheckingOut(true);
    setError("");

    try {
      const response = await axios.post(`${FASTAPI_URL}/api/payments/razorpay/demo-pay`, {
        memberId: memberId,
        planId: selectedPlanId,
      });

      if (response.data.status === "success") {
        onSuccess();
        onClose();
      } else {
        setError("Demo payment failed to process.");
      }
    } catch (err: any) {
      console.error("[Demo Pay] Checkout Error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to process Demo Payment.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop */}
          <motion.div
            variants={fadeInOut}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Dialog Body */}
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-panel p-6 rounded-3xl border border-white/10 w-full max-w-md relative z-10 bg-[#0d0d11]/90 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={checkingOut}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge */}
            <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 mx-auto shadow-inner">
              <CreditCard className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-white text-center">Online Payment</h3>
            <p className="text-xs text-white/40 mt-1 text-center font-medium">
              Secure billing gateway powered by <span className="text-cyan-400 font-bold">Razorpay</span>
            </p>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs mt-4">
                {error}
              </div>
            )}

            {loadingPlans ? (
              <div className="flex justify-center py-8">
                <Loader className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-5 mt-6">
                <div>
                  <label className="text-xs text-white/60 font-medium block mb-1.5 uppercase tracking-wider">
                    Select Plan
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    disabled={checkingOut}
                    className="glass-input cursor-pointer focus:border-violet-500"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#09090b] text-white">
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlan && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Base Plan Price</span>
                      <span>₹{selectedPlan.price.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>GST ({selectedPlan.gstPercent || 18}%)</span>
                      <span>₹{tax.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="border-t border-white/5 pt-2.5 flex justify-between text-sm font-bold text-white">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        Total Payable
                      </span>
                      <span className="text-cyan-400">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDemoPayment}
                    disabled={checkingOut || !selectedPlanId}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500/20"
                  >
                    {checkingOut ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Demo Pay (Sandbox Bypass)
                      </>
                    )}
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={checkingOut}
                      className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors border border-white/10 text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={checkingOut || !selectedPlanId}
                      className="flex-1 py-3 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-semibold flex items-center justify-center gap-2 border border-violet-500/30 transition-all duration-300 hover:text-white"
                    >
                      Pay via Razorpay
                    </button>
                  </div>
                </div>
              </div>
            )
          }
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}

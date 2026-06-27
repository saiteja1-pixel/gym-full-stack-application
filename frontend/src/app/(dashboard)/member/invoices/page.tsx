"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, Loader, AlertTriangle, Receipt } from "lucide-react";
import api from "@/lib/api";
import { pageTransition, listContainer, listItem } from "@/lib/animations";
import { formatDate, formatCurrency } from "@/lib/utils";
import { exportInvoicePdf } from "@/lib/exportInvoicePdf";

interface Payment {
  id: string;
  invoiceNumber: string;
  amountPaid: number;
  totalAmount: number;
  taxAmount: number;
  paymentDate: string;
  status: "PAID" | "PENDING" | "PARTIAL" | "REFUNDED";
  method: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
  notes: string | null;
}

interface MemberProfile {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  membership?: {
    plan?: {
      name: string;
      durationDays: number;
    };
  };
}

export default function MemberInvoicesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch current logged-in user profile details
        const meResponse = await api.get("/api/auth/me");
        const profile = meResponse.data.memberProfile;
        
        if (!profile) {
          setError("No member profile associated with this account.");
          setLoading(false);
          return;
        }

        setMemberProfile(profile);
        setUserEmail(meResponse.data.email);

        // 2. Fetch payments for this specific member ID
        const paymentsResponse = await api.get(`/api/payments/member/${profile.id}`);
        setPayments(paymentsResponse.data);
      } catch (err: any) {
        console.error("Failed to load invoice history:", err);
        setError("Could not load your payment history. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadPdf = (payment: Payment) => {
    if (!memberProfile) return;

    // Structure member meta matching jsPDF generator requirements
    const memberData = {
      ...memberProfile,
      user: { email: userEmail },
    };

    exportInvoicePdf(payment, memberData);
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
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Receipts & <span className="gradient-text">Invoices</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          View your full payment records and download printable PDF invoices.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader className="h-8 w-8 text-violet-500 animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-medium">Fetching invoice ledger...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center max-w-md mx-auto rounded-2xl border border-white/5">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-white/80 text-sm font-semibold">{error}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-panel py-20 text-center rounded-2xl border border-white/5 space-y-4">
          <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 inline-flex text-white/20">
            <Receipt className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No Invoices Yet</h3>
            <p className="text-white/40 text-sm max-w-xs mx-auto mt-1">
              Once payments are logged by gym administration, invoices will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/50 text-[10px] uppercase font-bold tracking-wider bg-white/[0.01]">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Plan Description</th>
                  <th className="px-6 py-4">Total Paid</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white/80">
                      {payment.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-white">
                          {memberProfile?.membership?.plan?.name || "Gym Membership Subscription"}
                        </span>
                        {payment.notes && (
                          <p className="text-xs text-white/40 mt-1 max-w-[200px] truncate">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrency(payment.amountPaid)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold bg-white/[0.03] border border-white/5 rounded px-2 py-0.5 uppercase">
                        {payment.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest ${
                          payment.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : payment.status === "PARTIAL"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadPdf(payment)}
                        className="py-1.5 px-3 bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.07] text-cyan-400 rounded-lg transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  X,
  Loader,
  AlertTriangle,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import { pageTransition, listContainer, listItem } from "@/lib/animations";
import { formatDate, formatCurrency } from "@/lib/utils";
import { exportInvoicePdf } from "@/lib/exportInvoicePdf";

interface Transaction {
  id: string;
  invoiceNumber: string;
  amountPaid: number;
  totalAmount: number;
  taxAmount: number;
  paymentDate: string;
  status: "PAID" | "PENDING" | "PARTIAL" | "REFUNDED";
  method: "CASH" | "UPI" | "CARD" | "BANK_TRANSFER";
  notes: string | null;
  member: {
    id: string;
    memberId: string;
    name: string;
    phone: string;
    user?: { email: string };
    membership?: {
      plan?: {
        name: string;
        durationDays: number;
      };
    };
  };
}

interface Member {
  id: string;
  memberId: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  gstPercent: number;
}

export default function PaymentLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Financial summary
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPending: 0,
    totalTransactions: 0,
  });

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ALL");
  const [method, setMethod] = useState("ALL");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "BANK_TRANSFER">("CASH");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/payments/ledger", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: status || undefined,
          method: method || undefined,
          page: currentPage,
          limit: 10,
        },
      });
      setTransactions(response.data.transactions);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching payment ledger:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, status, method, currentPage]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Load dropdown resources when opening modal
  useEffect(() => {
    if (isModalOpen) {
      async function loadResources() {
        try {
          const [membersRes, plansRes] = await Promise.all([
            api.get("/api/admin/members?limit=1000"),
            api.get("/api/admin/membership-plans"),
          ]);
          setMembers(membersRes.data.members || []);
          // Filter to active plans only
          setPlans(plansRes.data.filter((p: any) => p.isActive) || []);
        } catch (error) {
          console.error("Error loading form selectors:", error);
        }
      }
      loadResources();
    }
  }, [isModalOpen]);

  // Calculate live breakdown when plan changes
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  const gstPercent = selectedPlan ? selectedPlan.gstPercent : 18;
  const taxAmount = basePrice * (gstPercent / 100);
  const totalAmount = basePrice + taxAmount;

  // Auto-fill amount paid when plan is selected
  useEffect(() => {
    if (selectedPlan) {
      setAmountPaid(totalAmount.toFixed(0));
    }
  }, [selectedPlanId, selectedPlan, totalAmount]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!selectedMemberId) {
      setFormError("Please select a member.");
      setIsSubmitting(false);
      return;
    }
    if (!selectedPlanId) {
      setFormError("Please select a membership plan.");
      setIsSubmitting(false);
      return;
    }
    if (!amountPaid || parseFloat(amountPaid) < 0) {
      setFormError("Please enter a valid amount paid.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/api/payments/invoice", {
        memberId: selectedMemberId,
        planId: selectedPlanId,
        amountPaid: parseFloat(amountPaid),
        totalAmount,
        taxAmount,
        method: paymentMethod,
        notes: notes || undefined,
      });

      // Reset form and reload
      setIsModalOpen(false);
      setSelectedMemberId("");
      setSelectedPlanId("");
      setAmountPaid("");
      setNotes("");
      setPaymentMethod("CASH");
      setCurrentPage(1);
      fetchLedger();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = (payment: Transaction) => {
    // Pass payment and nested member structure to jsPDF generator
    exportInvoicePdf(payment, payment.member);
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
            Payment <span className="gradient-text">Ledger</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Track transactions, manual entries, and print invoices.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Financial Summaries Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {formatCurrency(summary.totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">
              Pending Amount
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {formatCurrency(summary.totalPending)}
            </h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">
              Total Invoices
            </p>
            <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {summary.totalTransactions}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input w-full p-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input w-full p-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input w-full p-2 text-sm text-white focus:outline-none bg-zinc-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="glass-input w-full p-2 text-sm text-white focus:outline-none bg-zinc-900"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setStatus("ALL");
            setMethod("ALL");
            setCurrentPage(1);
          }}
          className="text-xs text-white/40 hover:text-white font-bold transition-colors pb-2 hover:underline cursor-pointer whitespace-nowrap"
        >
          Reset Filters
        </button>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader className="h-8 w-8 text-violet-500 animate-spin mx-auto" />
            <p className="text-white/40 text-sm">Querying ledger records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Receipt className="h-10 w-10 text-white/20 mx-auto" />
            <p className="text-white/40 text-sm">No transaction records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/50 text-[10px] uppercase font-bold tracking-wider bg-white/[0.01]">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Tax (GST)</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-white/80">
                      {tx.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{tx.member?.name}</div>
                        <div className="text-[11px] text-white/40 font-mono mt-0.5">
                          {tx.member?.memberId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrency(tx.amountPaid)}
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {formatCurrency(tx.taxAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold bg-white/[0.03] border border-white/5 rounded px-2 py-0.5 uppercase">
                        {tx.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          tx.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : tx.status === "PARTIAL"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {formatDate(tx.paymentDate)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownloadPdf(tx)}
                        className="p-2 bg-white/[0.03] border border-white/5 hover:border-white/20 hover:bg-white/[0.07] text-cyan-400 rounded-lg transition-all inline-flex items-center gap-1.5 text-xs font-semibold"
                        title="Download PDF Invoice"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/[0.01]">
            <span className="text-xs text-white/40">
              Showing Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => c - 1)}
                className="px-3 py-1.5 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => c + 1)}
                className="px-3 py-1.5 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 text-white rounded-lg text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Record Manual Payment</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    Generate an invoice and update membership logs.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRecordPayment} className="space-y-4">
                {/* Select Member */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    Select Member
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm text-white focus:outline-none bg-zinc-900"
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Plan */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    Select Plan
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="glass-input w-full p-2.5 text-sm text-white focus:outline-none bg-zinc-900"
                    required
                  >
                    <option value="">-- Choose Plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live GST Breakdown Preview */}
                {selectedPlan && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-2">
                    <span className="font-bold text-white/80 uppercase tracking-wider text-[10px]">
                      Live GST Calculation
                    </span>
                    <div className="flex justify-between">
                      <span className="text-white/40">Base Subscription Price:</span>
                      <span className="font-semibold text-white">{formatCurrency(basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">GST ({gstPercent}%):</span>
                      <span className="font-semibold text-white">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="border-t border-white/5 my-1" />
                    <div className="flex justify-between text-sm font-bold text-violet-400">
                      <span>Total Invoice Amount:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Amount Paid and Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="e.g. 5000"
                      className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as "CASH" | "UPI" | "CARD" | "BANK_TRANSFER"
                        )
                      }
                      className="glass-input w-full p-2.5 text-sm text-white focus:outline-none bg-zinc-900"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paid in full for annual renewals"
                    rows={2}
                    className="glass-input w-full p-2.5 text-sm text-white focus:outline-none resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      "Record Payment"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

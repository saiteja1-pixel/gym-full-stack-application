"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Calendar,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Table,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { pageTransition } from "@/lib/animations";
import { formatDate, formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

type TabType = "revenue" | "attendance" | "members" | "weight";
type ExportFormat = "csv" | "excel" | "pdf";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("revenue");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<ExportFormat>("csv");
  
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch report data based on active tab and date filters
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let endpoint = "";
      if (activeTab === "revenue") endpoint = "/api/reports/revenue";
      else if (activeTab === "attendance") endpoint = "/api/reports/attendance";
      else if (activeTab === "members") endpoint = "/api/reports/members";
      else if (activeTab === "weight") endpoint = "/api/reports/weight-progress";

      const response = await api.get(endpoint, { params });
      
      if (activeTab === "revenue") {
        setReportData(response.data.payments || []);
        setRevenueSummary({
          monthlySummary: response.data.monthlySummary || [],
          totalRevenue: response.data.totalRevenue || 0
        });
      } else if (activeTab === "attendance") {
        setReportData(response.data.attendance || []);
      } else if (activeTab === "members") {
        setReportData(response.data.members || []);
      } else if (activeTab === "weight") {
        setReportData(response.data.logs || []);
      }
    } catch (error: any) {
      console.error("Failed to load report data:", error);
      setStatusMessage({
        text: error.response?.data?.error || "Failed to load report data from server.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate]);

  const showStatus = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Dynamic exports trigger
  const handleExportReport = () => {
    if (!reportData || reportData.length === 0) {
      showStatus("No data available to export. Adjust date filters or record entries first.", "error");
      return;
    }

    try {
      let headers: string[] = [];
      let rows: any[][] = [];
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `corefit_${activeTab}_report_${timestamp}`;

      if (activeTab === "revenue") {
        headers = ["Invoice #", "Member Name", "Phone", "Date", "Paid Amount (INR)", "Status", "Method", "Notes"];
        rows = reportData.map((item) => [
          item.invoiceNumber || "",
          item.member?.name || "N/A",
          item.member?.phone || "N/A",
          new Date(item.paymentDate).toLocaleDateString("en-IN"),
          item.amountPaid || 0,
          item.status || "N/A",
          item.method || "N/A",
          item.notes || "",
        ]);
      } else if (activeTab === "attendance") {
        headers = ["Check-In Time", "Member ID", "Name", "Phone", "Status"];
        rows = reportData.map((item) => [
          new Date(item.checkInTime).toLocaleString("en-IN"),
          item.member?.memberId || "",
          item.member?.name || "",
          item.member?.phone || "",
          item.status || "VALID",
        ]);
      } else if (activeTab === "members") {
        headers = ["Member ID", "Name", "Email", "Phone", "Gender", "Plan Name", "Start Date", "End Date", "Status", "Trainer"];
        rows = reportData.map((item) => [
          item.memberId || "",
          item.name || "",
          item.user?.email || "",
          item.phone || "",
          item.gender || "",
          item.membership?.plan?.name || "None",
          item.membership?.startDate ? new Date(item.membership.startDate).toLocaleDateString("en-IN") : "N/A",
          item.membership?.endDate ? new Date(item.membership.endDate).toLocaleDateString("en-IN") : "N/A",
          item.membership?.status || "INACTIVE",
          item.trainer?.name || "None",
        ]);
      } else if (activeTab === "weight") {
        headers = ["Log Date", "Member ID", "Name", "Weight (kg)", "Height (cm)", "BMI", "Body Fat (%)", "Notes"];
        rows = reportData.map((item) => [
          new Date(item.logDate).toLocaleDateString("en-IN"),
          item.member?.memberId || "",
          item.member?.name || "",
          item.weight || 0,
          item.height || 0,
          item.bmi || 0,
          item.bodyFat !== null && item.bodyFat !== undefined ? item.bodyFat : "N/A",
          item.notes || "",
        ]);
      }

      if (format === "csv") {
        const csvData = [headers, ...rows];
        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showStatus(`CSV report exported successfully! Saved as ${fileName}.csv`);
      } else if (format === "excel") {
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report Data");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
        showStatus(`Excel ledger exported successfully! Saved as ${fileName}.xlsx`);
      } else if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFont("helvetica", "bold");
        doc.text(`Core Fit Club - ${activeTab.toUpperCase()} REPORT`, 14, 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 22);

        if (startDate || endDate) {
          doc.text(`Filter range: ${startDate || "Any"} to ${endDate || "Any"}`, 14, 27);
        }

        (doc as any).autoTable({
          head: [headers],
          body: rows,
          startY: startDate || endDate ? 32 : 28,
          theme: "striped",
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255] }, // Core violet theme
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        doc.save(`${fileName}.pdf`);
        showStatus(`PDF document exported successfully! Saved as ${fileName}.pdf`);
      }
    } catch (err: any) {
      console.error("Export failure:", err);
      showStatus("Failed to format and download report. Try another format.", "error");
    }
  };

  const getFormatIcon = (f: ExportFormat) => {
    switch (f) {
      case "csv":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-cyan-400" />;
      case "pdf":
        return <FileText className="h-4 w-4 text-rose-400" />;
    }
  };

  const previewRows = reportData.slice(0, 10);

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Audit <span className="gradient-text">Reports</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Query, analyze, and download active gym statistics in standard business formats.
        </p>
      </div>

      {/* Date Range Config Glass Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
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
            className="glass-input w-full p-2.5 text-sm text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
            Export Format
          </label>
          <div className="flex gap-2">
            {(["csv", "excel", "pdf"] as ExportFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex-1 py-2 px-3 border rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                  format === f
                    ? "bg-violet-600/20 border-violet-500 text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05] text-white/60"
                }`}
              >
                {getFormatIcon(f)}
                <span>{f}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExportReport}
          disabled={isLoading || reportData.length === 0}
          className={`btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            reportData.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_15px_rgba(124,58,237,0.4)]"
          }`}
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>

      {/* Floating Status Notification Alerts */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 shadow-xl ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <div>
              <span>{statusMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previews and Data Listing panel */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[520px]">
        {/* Navigation tabs */}
        <div className="flex border-b border-white/5 bg-white/[0.01] overflow-x-auto scrollbar-thin">
          {(
            [
              { id: "revenue", label: "Revenue Ledger" },
              { id: "attendance", label: "Attendance Logs" },
              { id: "members", label: "Members List" },
              { id: "weight", label: "Weight Progress" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setReportData([]);
              }}
              className={`flex-1 md:flex-initial min-w-[120px] px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-violet-500 text-white bg-white/[0.02]"
                  : "border-transparent text-white/40 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/30 tracking-wider">
              <Table className="h-4 w-4" />
              <span>Live Preview (Showing top {previewRows.length} matches)</span>
            </div>
            
            {/* Total count details */}
            <span className="text-xs text-white/40 font-mono">
              Total Records: {reportData.length}
            </span>
          </div>

          {isLoading ? (
            /* Elegant Skeleton Loader */
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-white/5 rounded-lg w-full" />
              <div className="h-24 bg-white/[0.02] rounded-xl w-full border border-white/5" />
              <div className="h-24 bg-white/[0.02] rounded-xl w-full border border-white/5" />
              <div className="h-24 bg-white/[0.02] rounded-xl w-full border border-white/5" />
            </div>
          ) : reportData.length === 0 ? (
            /* Empty State */
            <div className="h-64 flex flex-col items-center justify-center text-white/20 text-sm gap-2">
              <AlertCircle className="h-10 w-10 text-white/5" />
              <p>No ledger matches found for this date range.</p>
              <p className="text-xs text-white/10">Try clearing filters or checking other panels.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === "revenue" && (
                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Invoice #</th>
                      <th className="pb-3 px-4">Member Name</th>
                      <th className="pb-3 px-4">Total Paid</th>
                      <th className="pb-3 px-4">Tax (GST)</th>
                      <th className="pb-3 px-4">Method</th>
                      <th className="pb-3 pl-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 font-mono font-bold text-violet-400">{row.invoiceNumber}</td>
                        <td className="py-3 px-4 font-medium text-white">{row.member?.name || "N/A"}</td>
                        <td className="py-3 px-4 text-white font-bold">{formatCurrency(row.amountPaid || 0)}</td>
                        <td className="py-3 px-4 text-white/50">{formatCurrency(row.taxAmount || 0)}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase text-cyan-400 font-bold">
                            {row.method}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-white/50">{formatDate(row.paymentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "attendance" && (
                <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4 font-mono">Timestamp</th>
                      <th className="pb-3 px-4">Member ID</th>
                      <th className="pb-3 px-4">Name</th>
                      <th className="pb-3 px-4">Phone</th>
                      <th className="pb-3 pl-4">Gate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 text-white/60 font-mono">
                          {new Date(row.checkInTime).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-400 font-bold">{row.member?.memberId || "N/A"}</td>
                        <td className="py-3 px-4 font-medium text-white">{row.member?.name || "N/A"}</td>
                        <td className="py-3 px-4 text-white/50">{row.member?.phone || "N/A"}</td>
                        <td className="py-3 pl-4">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                              row.status === "VALID"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "members" && (
                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 px-4">Name</th>
                      <th className="pb-3 px-4">Phone</th>
                      <th className="pb-3 px-4">Plan Type</th>
                      <th className="pb-3 px-4">Trainer</th>
                      <th className="pb-3 pl-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 font-mono text-cyan-400">{row.memberId}</td>
                        <td className="py-3 px-4 font-medium text-white">{row.name}</td>
                        <td className="py-3 px-4 text-white/60">{row.phone}</td>
                        <td className="py-3 px-4 text-white/80">{row.membership?.plan?.name || "No Plan"}</td>
                        <td className="py-3 px-4 text-white/50">{row.trainer?.name || "None"}</td>
                        <td className="py-3 pl-4">
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                              row.membership?.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : row.membership?.status === "FROZEN"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {row.membership?.status || "INACTIVE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "weight" && (
                <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-xs font-semibold uppercase">
                      <th className="pb-3 pr-4">Log Date</th>
                      <th className="pb-3 px-4">ID</th>
                      <th className="pb-3 px-4">Name</th>
                      <th className="pb-3 px-4">Weight</th>
                      <th className="pb-3 px-4">Height</th>
                      <th className="pb-3 px-4">BMI</th>
                      <th className="pb-3 pl-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 pr-4 text-white/50">{formatDate(row.logDate)}</td>
                        <td className="py-3 px-4 font-mono text-cyan-400">{row.member?.memberId || "N/A"}</td>
                        <td className="py-3 px-4 font-medium text-white">{row.member?.name || "N/A"}</td>
                        <td className="py-3 px-4 text-white font-bold">{row.weight} kg</td>
                        <td className="py-3 px-4 text-white/70">{row.height} cm</td>
                        <td className="py-3 px-4 text-cyan-400 font-semibold">{row.bmi}</td>
                        <td className="py-3 pl-4 text-white/40 truncate max-w-[150px]">{row.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  CheckCircle,
  XCircle,
  Camera,
  AlertTriangle,
  WifiOff,
  Clock,
  ChevronRight,
  User,
  Loader,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface ScanLog {
  id: string;
  name: string;
  memberId: string;
  status: string;
  time: Date;
}

interface ScanResponse {
  name: string;
  avatarUrl: string | null;
  planName: string;
  endDate: string;
}

export default function AdminScanPage() {
  const [scanLog, setScanLog] = useState<ScanLog[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [cameraError, setCameraError] = useState("");

  // Scan result overlay states
  const [showOverlay, setShowOverlay] = useState<"valid" | "denied" | null>(null);
  const [memberDetails, setMemberDetails] = useState<ScanResponse | null>(null);
  const [denialReason, setDenialReason] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingScan = useRef(false);

  // Monitor network connection status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Fetch initial scan history on mount
  useEffect(() => {
    async function fetchInitialLogs() {
      try {
        const res = await api.get("/api/attendance/logs", {
          params: { page: 1, limit: 10 },
        });
        const formattedLogs = res.data.logs.map((log: any) => ({
          id: log.id,
          name: log.member?.name || "Unknown Member",
          memberId: log.member?.memberId || "N/A",
          status: log.status,
          time: new Date(log.checkInTime),
        }));
        setScanLog(formattedLogs);
      } catch (err) {
        console.error("Error loading scan logs:", err);
      }
    }
    fetchInitialLogs();
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    let html5QrCode: Html5Qrcode;

    async function startScanner() {
      try {
        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 8,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Success handler
            const online = typeof navigator !== "undefined" ? navigator.onLine : true;
            if (isProcessingScan.current || !online) {
              return; // Pause scanner during overlay presentation or offline state
            }
            isProcessingScan.current = true;
            await handleQrScan(decodedText);
          },
          () => {
            // Verbose error logging disabled for cleaner logs
          }
        );
        setCameraPermission("granted");
      } catch (err: any) {
        console.error("Camera startup error:", err);
        setCameraError(err.message || "Failed to access camera.");
        if (err.name === "NotAllowedError" || err.message?.includes("Permission denied")) {
          setCameraPermission("denied");
        }
      }
    }

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear();
          })
          .catch((err) => console.error("Error closing scanner:", err));
      }
    };
  }, []);

  const handleQrScan = async (token: string) => {
    try {
      const response = await api.post("/api/attendance/scan", { qrCodeToken: token });
      
      // Validation Success
      setMemberDetails(response.data.member);
      setShowOverlay("valid");

      // Prepend to visual scan log
      const newLog: ScanLog = {
        id: Math.random().toString(),
        name: response.data.member.name,
        memberId: "CF-Scanned", // Just placeholder for instant log
        status: "VALID",
        time: new Date(),
      };
      setScanLog((prev) => [newLog, ...prev.slice(0, 9)]);

      // Dismiss overlay after 4 seconds
      setTimeout(() => {
        setShowOverlay(null);
        setMemberDetails(null);
        isProcessingScan.current = false;
      }, 4000);

    } catch (error: any) {
      // Validation Failure
      const code = error.response?.data?.denialCode || "INVALID";
      const message = error.response?.data?.error || "Access Denied.";

      setDenialReason(message);
      setShowOverlay("denied");

      const newLog: ScanLog = {
        id: Math.random().toString(),
        name: code === "INVALID_TOKEN" ? "Visitor / Unknown" : "Gym Member",
        memberId: code,
        status: code,
        time: new Date(),
      };
      setScanLog((prev) => [newLog, ...prev.slice(0, 9)]);

      setTimeout(() => {
        setShowOverlay(null);
        setDenialReason("");
        isProcessingScan.current = false;
      }, 4000);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col xl:flex-row gap-6 p-1">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="absolute top-0 inset-x-0 z-40 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 rounded-xl">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>No internet connection. Scans cannot be validated.</span>
        </div>
      )}

      {/* Fullscreen Overlays */}
      <AnimatePresence>
        {showOverlay === "valid" && memberDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-emerald-950/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, transition: { type: "spring", delay: 0.1 } }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="space-y-6 max-w-md flex flex-col items-center"
            >
              {/* Animated checkmark icon */}
              <div className="h-24 w-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                <CheckCircle className="h-14 w-14 text-emerald-400" />
              </div>
              
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                  Access Granted
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight mt-4">
                  {memberDetails.name}
                </h2>
              </div>

              {memberDetails.avatarUrl ? (
                <img
                  src={memberDetails.avatarUrl}
                  alt={memberDetails.name}
                  className="w-28 h-28 rounded-full border-2 border-emerald-500/30 object-cover shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-2 border-emerald-500/30 bg-zinc-900 flex items-center justify-center shadow-xl">
                  <User className="h-12 w-12 text-white/20" />
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 w-full space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Active Plan:</span>
                  <span className="font-bold text-emerald-300">{memberDetails.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Valid Until:</span>
                  <span className="font-semibold text-white/90">
                    {formatDate(memberDetails.endDate)}
                  </span>
                </div>
              </div>

              <p className="text-white/30 text-xs font-semibold animate-pulse mt-4">
                Dismissing screen in 4 seconds...
              </p>
            </motion.div>
          </motion.div>
        )}

        {showOverlay === "denied" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-rose-950/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: { type: "spring", delay: 0.1 },
              }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="space-y-6 max-w-md flex flex-col items-center"
            >
              {/* Pulsing XCircle icon */}
              <div className="h-24 w-24 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-bounce">
                <XCircle className="h-14 w-14 text-rose-500" />
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30">
                  Access Denied
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight mt-4 text-rose-200">
                  Authentication Failed
                </h2>
                <p className="text-lg text-white/80 mt-2 font-medium bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 max-w-sm">
                  {denialReason}
                </p>
              </div>

              <p className="text-white/30 text-xs font-semibold animate-pulse mt-6">
                Dismissing screen in 4 seconds...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main scanner viewport */}
      <div className="flex-1 glass-panel p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-30%] left-[-10%] w-[350px] h-[350px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

        {cameraPermission === "denied" ? (
          <div className="max-w-md text-center space-y-4 p-4 z-10">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl inline-flex mb-2">
              <Camera className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white">Camera Access Blocked</h3>
            <p className="text-sm text-white/55 leading-relaxed">
              We need camera permissions to scan member QR Codes. Please allow camera permissions for this site in your browser settings and refresh the page.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs space-y-1.5 text-white/40">
              <span className="font-bold text-white/70">How to unlock:</span>
              <p>1. Click the lock icon 🔒 next to the URL bar.</p>
              <p>2. Toggle the Camera option to **Allow**.</p>
              <p>3. Refresh this page to restart camera terminal.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md">
            <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[10px] font-bold mb-4">
              <QrCode className="h-4 w-4" />
              <span>Scanning Active</span>
            </div>

            {/* Target scanner container */}
            <div className="relative w-72 h-72 rounded-2xl border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
              {/* Scanner video element */}
              <div id="reader" className="w-full h-full object-cover [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />

              {/* Targets boxes overlays */}
              <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none flex items-center justify-center">
                <div className="w-[180px] h-[180px] border border-cyan-400/40 relative rounded">
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 -mt-0.5 -ml-0.5" />
                  <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 -mt-0.5 -mr-0.5" />
                  <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 -mb-0.5 -ml-0.5" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 -mb-0.5 -mr-0.5" />
                  {/* Laser line animation */}
                  <span className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scanLaser_2s_infinite]" />
                </div>
              </div>
            </div>

            <p className="text-white/50 text-xs mt-6 text-center">
              Hold the member QR code in front of the camera to validate entry.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar Live Feed */}
      <div className="w-full xl:w-[350px] glass-panel p-6 rounded-2xl border border-white/5 flex flex-col max-h-[500px] xl:max-h-none overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5 shrink-0">
          <Clock className="h-4 w-4 text-white/40" />
          <h3 className="font-bold text-sm">Scan Terminal Logs</h3>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 space-y-3 pr-1">
          {scanLog.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-10">No recent scans recorded.</p>
          ) : (
            scanLog.map((log) => (
              <div key={log.id} className="flex items-center justify-between pt-3 first:pt-0">
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-white leading-tight truncate">
                    {log.name}
                  </h4>
                  <p className="text-[10px] text-white/45 mt-0.5 font-mono">
                    {log.memberId}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      log.status === "VALID"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : log.status === "DUPLICATE"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-[9px] text-white/30 font-semibold whitespace-nowrap">
                    {log.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Laser line scan custom keyframe animation inside style block */}
      <style jsx global>{`
        @keyframes scanLaser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}

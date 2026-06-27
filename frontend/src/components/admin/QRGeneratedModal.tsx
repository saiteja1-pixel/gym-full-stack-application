"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { Download, X, CheckCircle, Copy, Check } from "lucide-react";
import { slideUp, fadeInOut } from "@/lib/animations";

interface QRGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  memberName: string;
  qrCodeToken: string;
}

export default function QRGeneratedModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  qrCodeToken
}: QRGeneratedModalProps) {
  const [copied, setCopied] = React.useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(qrCodeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("member-qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_Code_${memberId}_${memberName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="glass-panel p-6 rounded-3xl border border-white/10 w-full max-w-md relative z-10 text-center flex flex-col items-center"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Checkmark Icon */}
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-white">Registration Complete</h3>
            <p className="text-xs text-white/40 mt-1">Member registered successfully in Core Fit Club database.</p>

            {/* Member Card */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/[0.01] my-5 w-full text-left">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">Member Name:</span>
                <span className="font-semibold text-white">{memberName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Gym Member ID:</span>
                <span className="font-semibold text-violet-400 font-mono">{memberId}</span>
              </div>
            </div>

            {/* QR Code Graphic Container */}
            <div
              ref={qrRef}
              className="glass-panel p-6 rounded-2xl border border-white/10 bg-white shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-5 flex flex-col items-center"
            >
              {/* Note: render as canvas so we can export it */}
              <QRCodeCanvas
                id="member-qr-canvas"
                value={qrCodeToken}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleDownloadQR}
                className="btn-primary flex items-center justify-center gap-2 py-3 rounded-xl"
              >
                <Download className="w-4 h-4" /> Download QR Code
              </button>

              <button
                onClick={handleCopyToken}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10 text-white/80"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied Token!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Secure QR Token
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

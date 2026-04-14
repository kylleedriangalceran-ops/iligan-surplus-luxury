"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyPickup } from "@/app/actions/merchant";
import { toast } from "sonner"; // Using sonner for toasts assuming it's installed

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (isOpen) {
      // Delay slightly to ensure DOM is ready for scanner
      const timeoutHover = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          async (decodedText) => {
            // Once we get a successful scan, freeze the scanner and process
            if (isVerifying) return;
            setIsVerifying(true);
            scanner?.pause(true);

            toast.loading("Verifying pickup pass...");

            try {
              const result = await verifyPickup(decodedText);
              toast.dismiss();

              if (result.error) {
                toast.error(result.error);
                // Resume scanning if it was an error
                scanner?.resume();
                setIsVerifying(false);
              } else {
                toast.success(result.message || "Pickup verified successfully!");
                // Force closure on success
                setTimeout(() => {
                  onClose();
                  setIsVerifying(false);
                }, 1000);
              }
            } catch (err) {
              toast.dismiss();
              toast.error("Failed to communicate with server.");
              scanner?.resume();
              setIsVerifying(false);
            }
          },
          () => {
            // Ignore ongoing scan errors which happen frequently
          }
        );
      }, 100);

      return () => {
        clearTimeout(timeoutHover);
        if (scanner) {
          scanner.clear().catch(console.error);
        }
      };
    }
  }, [isOpen, isVerifying, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-6"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px] bg-[#FAF9F6] shadow-[0_30px_80px_rgba(0,0,0,0.2)] relative overflow-hidden rounded-[24px]"
          >
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between border-b border-[#1C1C1E]/5 bg-white/50 backdrop-blur-md">
              <div className="flex flex-col">
                <h3 className="text-[14px] font-bold tracking-[0.15em] uppercase text-[#1C1C1E]">
                  Verify Pass
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-[#1C1C1E]/60 mt-1 font-medium">
                  Scan Customer QR
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1C1C1E]/5 text-[#1C1C1E]/60 hover:bg-[#1C1C1E]/10 hover:text-[#1C1C1E] transition-all"
                disabled={isVerifying}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Global CSS override for html5-qrcode fallback UI */}
            <style dangerouslySetInnerHTML={{ __html: `
              #qr-reader {
                border: none !important;
                background: transparent !important;
              }
              #qr-reader * {
                box-sizing: border-box !important;
              }
              #qr-reader__dashboard_section_csr {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 20px 10px !important;
                gap: 16px !important;
              }
              #qr-reader__dashboard_section_csr > span {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                text-align: center !important;
                width: 100% !important;
                margin: 0 !important;
                float: none !important;
              }
              #qr-reader img {
                margin: 0 auto !important;
                display: block !important;
                max-width: 48px !important;
                opacity: 0.6 !important;
              }
              #qr-reader span,
              #qr-reader div {
                text-align: center !important;
                font-size: 12px !important;
                color: #1C1C1E !important;
                letter-spacing: 0.05em !important;
                text-decoration: none !important;
                float: none !important;
                clear: both !important;
              }
              #qr-reader a {
                color: #1C1C1E !important;
                opacity: 0.5 !important;
                margin-top: 16px !important;
                display: inline-block !important;
                text-decoration: underline !important;
                font-size: 11px !important;
                cursor: pointer !important;
              }
              #qr-reader a:hover {
                opacity: 1 !important;
              }
              #qr-reader button {
                background: #1C1C1E !important;
                color: #FAF9F6 !important;
                padding: 14px 24px !important;
                border: none !important;
                border-radius: 8px !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.1em !important;
                margin-top: 10px !important;
                cursor: pointer !important;
                width: 100% !important;
                max-width: 220px !important;
                display: block !important;
                transition: opacity 0.2s !important;
                position: relative !important;
              }
              #qr-reader button:hover {
                opacity: 0.8 !important;
              }
              #qr-reader__dashboard_section_csr button {
                color: transparent !important; /* Hide original text */
              }
              #qr-reader__dashboard_section_csr button::after {
                content: "ENABLE CAMERA" !important;
                color: #FAF9F6 !important;
                position: absolute !important;
                inset: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 11px !important;
                font-weight: 600 !important;
                letter-spacing: 0.1em !important;
              }
              /* Hide ScanApp banner and links entirely */
              img[alt="Info icon"],
              a[href*="scanapp.org"],
              #qr-reader__dashboard_section_swaplink {
                display: none !important;
              }
              span[style*="red"] {
                display: none !important;
              }
            `}} />

            {/* Scanner Container */}
            <div className="p-6 md:p-8">
              <div 
                id="qr-reader" 
                className={`w-full overflow-hidden border border-[#1C1C1E]/10 bg-white flex flex-col items-center justify-center relative rounded-[16px] shadow-inner ${isVerifying ? 'opacity-40 pointer-events-none' : ''}`}
                style={{ aspectRatio: '1/1', minHeight: '320px' }}
              >
              </div>
            </div>
            
            {/* Footer Status */}
            <div className="px-8 pb-8 text-center flex flex-col justify-end">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={isVerifying ? 'verifying' : 'active'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] uppercase tracking-widest font-semibold text-[#1C1C1E]/70 whitespace-nowrap"
                >
                  {isVerifying ? "Verifying Transaction…" : "Align QR in Frame to Scan"}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

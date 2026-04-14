"use client";

import React, { useState } from "react";
import { QRScannerModal } from "./QRScannerModal";
import { ActionButton } from "@/components/shared/ActionButton";

export function ScanPickupButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ActionButton
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      >
        Scan Pickup
      </ActionButton>

      <QRScannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

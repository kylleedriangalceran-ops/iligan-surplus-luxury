"use client";

import React, { useState } from "react";
import { TicketModal } from "./TicketModal";
import { ReservationWithDetails } from "@/lib/repositories/reservationRepository";

interface CustomerReservationListProps {
  reservations: ReservationWithDetails[];
}

const statusStyles: Record<string, string> = {
  PENDING: "text-amber-600 bg-amber-50 border-amber-200",
  CLAIMED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  CANCELLED: "text-red-400 bg-red-50/50 border-red-200",
};

export function CustomerReservationList({ reservations }: CustomerReservationListProps) {
  const [selectedRes, setSelectedRes] = useState<ReservationWithDetails | null>(null);

  if (reservations.length === 0) return null;

  return (
    <>
      <div className="space-y-6">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            onClick={() => {
              if (reservation.status === 'PENDING') setSelectedRes(reservation);
            }}
            className={`border border-border/40 bg-card transition-shadow duration-500 ${
              reservation.status === 'PENDING' ? 'cursor-pointer hover:shadow-[0_4px_20px_rgb(0,0,0,0.05)]' : 'opacity-80'
            }`}
          >
            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Token Display — Prominent */}
              <div className="flex flex-col items-center justify-center min-w-[140px] py-4 px-6 bg-secondary/30 border border-border/20">
                <span className="text-2xl font-mono font-bold tracking-[0.15em] text-foreground">
                  {reservation.reservationToken}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2 font-medium">
                  {reservation.status === 'PENDING' ? 'Tap for Pass' : 'Pickup Code'}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {reservation.listingTitle}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 border ${statusStyles[reservation.status] || ""}`}>
                      {reservation.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {reservation.storeName}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Pickup: {reservation.pickupTimeWindow}
                  </p>
                </div>

                <div className="flex items-end justify-between mt-4 pt-4 border-t border-border/30">
                  <span className="text-base font-medium tracking-tight">
                    ₱{reservation.reservedPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    Reserved: {new Date(reservation.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Internal Modal State */}
      <TicketModal
        isOpen={!!selectedRes}
        onClose={() => setSelectedRes(null)}
        reservationId={selectedRes?.id || ""}
        reservationToken={selectedRes?.reservationToken || ""}
        listingTitle={selectedRes?.listingTitle || ""}
        storeName={selectedRes?.storeName || ""}
        pickupTimeWindow={selectedRes?.pickupTimeWindow || ""}
      />
    </>
  );
}

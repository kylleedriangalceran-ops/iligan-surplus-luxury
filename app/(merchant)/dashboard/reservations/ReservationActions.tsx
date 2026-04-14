"use client";

import React, { useTransition } from "react";
import { updateReservationStatusAction } from "@/app/actions/merchant";
import { useToast } from "@/hooks/useToast";

export function ReservationActions({ reservationId }: { reservationId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAction = (status: "CLAIMED" | "CANCELLED") => {
    startTransition(async () => {
      try {
        await updateReservationStatusAction(reservationId, status);
        toast(
          status === "CLAIMED" ? "Reservation claimed" : "Reservation cancelled",
          status === "CLAIMED" ? "success" : "info"
        );
      } catch {
        toast("Failed to update reservation", "error");
      }
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("CLAIMED")}
        disabled={isPending}
        className="text-[10px] uppercase tracking-widest font-medium px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "..." : "Claim"}
      </button>
      <button
        onClick={() => handleAction("CANCELLED")}
        disabled={isPending}
        className="text-[10px] uppercase tracking-widest font-medium px-3 py-1.5 border border-border rounded-md hover:border-foreground transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "..." : "Cancel"}
      </button>
    </div>
  );
}

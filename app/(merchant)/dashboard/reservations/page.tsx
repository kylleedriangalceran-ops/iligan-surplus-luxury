import React from "react";
import { auth } from "@/lib/auth";
import { findStoreByMerchantId } from "@/lib/repositories/storeRepository";
import { getReservationsByStoreId } from "@/lib/repositories/reservationRepository";
import { redirect } from "next/navigation";
import { ReservationActions } from "./ReservationActions";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function MerchantReservationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const store = await findStoreByMerchantId(session.user.id);
  if (!store) redirect("/dashboard");

  const reservations = await getReservationsByStoreId(store.id);

  const statusColors: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50 border-amber-200",
    CLAIMED: "text-emerald-600 bg-emerald-50 border-emerald-200",
    CANCELLED: "text-red-400 bg-red-50 border-red-200",
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Orders' }]} className="mb-6" />
      <div className="mb-12">
        <h1 className="text-3xl font-light tracking-[0.1em] uppercase mb-2">
          Reservations
        </h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          {reservations.length} total
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-border/50">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-light mb-2">
            No reservations yet
          </p>
          <p className="text-xs text-muted-foreground/60">
            Reservations will appear here when customers reserve your items.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="border border-border/40 bg-card p-6 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-shadow duration-500"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      {reservation.listingTitle}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 border ${statusColors[reservation.status] || ""}`}>
                      {reservation.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    <span className="font-medium">{reservation.customerName}</span> — {reservation.customerEmail}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Pickup: {reservation.pickupTimeWindow}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-lg font-mono font-bold tracking-widest text-foreground">
                      {reservation.reservationToken}
                    </span>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                      Token
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-medium">
                      ₱{reservation.reservedPrice.toFixed(2)}
                    </span>
                  </div>

                  {reservation.status === "PENDING" && (
                    <ReservationActions reservationId={reservation.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { auth } from "@/lib/auth";
import { getReservationsByCustomerId } from "@/lib/repositories/reservationRepository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const dynamic = "force-dynamic";

export default async function CustomerReservationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reservations = await getReservationsByCustomerId(session.user.id);

  const statusStyles: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50 border-amber-200",
    CLAIMED: "text-emerald-600 bg-emerald-50 border-emerald-200",
    CANCELLED: "text-red-400 bg-red-50/50 border-red-200",
  };

  return (
    <div className="min-h-screen py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs />
        <div className="mb-16 flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-2">
              My Reserves
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">
              {reservations.length} {reservations.length === 1 ? "reservation" : "reservations"}
            </p>
          </div>
          <Link
            href="/feed"
            className="text-xs uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-1"
          >
            Browse Drops
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-border/50">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-light mb-2">
              No reservations yet
            </p>
            <p className="text-xs text-muted-foreground/60 mb-6">
              Browse the curated feed and reserve your first item.
            </p>
            <Link
              href="/feed"
              className="text-xs uppercase tracking-widest font-medium text-foreground border-b border-foreground pb-1 hover:text-muted-foreground transition-colors"
            >
              View Drops
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="border border-border/40 bg-card hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-shadow duration-500"
              >
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  {/* Token Display — Prominent */}
                  <div className="flex flex-col items-center justify-center min-w-[140px] py-4 px-6 bg-secondary/30 border border-border/20">
                    <span className="text-2xl font-mono font-bold tracking-[0.15em] text-foreground">
                      {reservation.reservationToken}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2 font-medium">
                      Pickup Code
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
                        {new Date(reservation.createdAt).toLocaleDateString("en-PH", {
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
        )}
      </div>
    </div>
  );
}

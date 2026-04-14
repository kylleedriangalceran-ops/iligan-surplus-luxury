import React from "react";
import { auth } from "@/lib/auth";
import { getReservationsByCustomerId } from "@/lib/repositories/reservationRepository";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CustomerReservationList } from "@/components/customer/CustomerReservationList";

export const dynamic = "force-dynamic";

export default async function CustomerReservationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reservations = await getReservationsByCustomerId(session.user.id);

  return (
    <div className="min-h-screen py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-[#1C1C1E]/10 pb-8 mt-4 md:mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <Breadcrumbs 
              items={[
                { label: 'Reserve', href: '/' },
                { label: 'My Reserves' }
              ]} 
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-2">
            My Reserves
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            {reservations.length} {reservations.length === 1 ? "reservation" : "reservations"}
          </p>
        </header>
        <div className="mb-16 flex items-end justify-between">
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
          <CustomerReservationList reservations={reservations} />
        )}
      </div>
    </div>
  );
}

import React from "react";
import { auth } from "@/lib/auth";
import { findStoreByMerchantId } from "@/lib/repositories/storeRepository";
import { getListingsByStoreId } from "@/lib/repositories/listingRepository";
import { redirect } from "next/navigation";
import { CreateDropPanel } from "@/components/merchant/CreateDropPanel";
import { StoreOnboardingForm } from "@/components/merchant/StoreOnboardingForm";
import { DashboardDrops } from "@/components/merchant/DashboardDrops";
import { RealtimeClock } from "@/components/shared/RealtimeClock";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const store = await findStoreByMerchantId(session.user.id);

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-light tracking-[0.1em] uppercase mb-4">
            Welcome, {session.user.name}
          </h1>
          <p className="text-sm text-[#1C1C1E]/60 uppercase tracking-widest">
            Set up your store to start listing surplus items
          </p>
        </div>
        <StoreOnboardingForm />
      </div>
    );
  }

  const listings = await getListingsByStoreId(store.id);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <h1 className="text-3xl font-light tracking-[0.1em] uppercase mb-2">
            {store.name}
          </h1>
          <p className="text-sm text-[#1C1C1E]/60 uppercase tracking-widest">
            {store.location}
          </p>
        </div>
        
        <CreateDropPanel />
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1C1E]">
          Active Drops
        </h2>
        <RealtimeClock />
      </div>

      <DashboardDrops listings={listings} />
    </div>
  );
}

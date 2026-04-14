import { auth } from "@/lib/auth";
import { findStoreByMerchantId } from "@/lib/repositories/storeRepository";
import { getListingsByStoreId } from "@/lib/repositories/listingRepository";
import { getMerchantAnalytics } from "@/lib/repositories/analyticsRepository";
import { getReservationsByStoreId } from "@/lib/repositories/reservationRepository";
import { redirect } from "next/navigation";
import { ScanPickupButton } from "@/components/merchant/ScanPickupButton";
import { CreateDropPanel } from "@/components/merchant/CreateDropPanel";
import { SetLocationWrapper } from "@/components/merchant/SetLocationWrapper";
import { StoreOnboardingForm } from "@/components/merchant/StoreOnboardingForm";
import { MerchantAnalytics } from "@/components/merchant/MerchantAnalytics";
import { RecentOrdersTable } from "@/components/merchant/RecentOrdersTable";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
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
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Merchant Dashboard' }]} className="mb-6" />
        <div className="mb-12">
          <h1 className="text-3xl font-light tracking-widest uppercase mb-4">
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
  const analytics = await getMerchantAnalytics(store.id);
  const reservations = await getReservationsByStoreId(store.id);
  const recentOrders = reservations.slice(0, 5).map((r) => ({
    id: r.id,
    customerName: r.customerName,
    listingTitle: r.listingTitle,
    createdAt: r.createdAt,
    reservedPrice: r.reservedPrice,
    status: r.status,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]} className="mb-6" />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-light tracking-widest uppercase mb-2">
            {store.name}
          </h1>
          <p className="text-sm text-[#1C1C1E]/60 uppercase tracking-widest">
            {store.location}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <SetLocationWrapper 
            currentLat={store.latitude}
            currentLng={store.longitude}
            storeName={store.name}
          />
          <ScanPickupButton />
          <CreateDropPanel />
        </div>
      </div>

      {/* Analytics Charts */}
      <MerchantAnalytics analytics={analytics} />

      <div className="mb-12">
        <RecentOrdersTable orders={recentOrders} />
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

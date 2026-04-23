import React from 'react';
import { getActiveListings } from '@/lib/repositories/listingRepository';
import { reserveSurplusItem } from '@/app/actions/listings';
import { LuxuryItemCard } from '@/components/shared/LuxuryItemCard';
import { RealtimeClock } from '@/components/shared/RealtimeClock';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { auth } from '@/lib/auth';
import { getReservationsByCustomerId } from '@/lib/repositories/reservationRepository';
import { getBatchAggregatedRatings } from '@/lib/repositories/reviewRepository';

export const revalidate = 60;

export default async function CustomerFeedPage() {
  const listings = await getActiveListings();
  const session = await auth();
  const userId = session?.user?.id;
  
  const reservedListingIds = new Set<string>();
  if (userId) {
    const reservations = await getReservationsByCustomerId(userId);
    reservations.forEach(r => reservedListingIds.add(r.listingId));
  }

  // Batch fetch ratings for all visible listings
  const listingIds = listings.map((l) => l.id);
  const ratingsMap = await getBatchAggregatedRatings(listingIds);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1E] py-16 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-[#1C1C1E]/10 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* Breadcrumbs */}
            {(() => {
              let rootLabel = 'Reserve';
              let rootHref = '/';
              
              if (session?.user?.role === 'ADMIN') {
                rootLabel = 'Admin';
                rootHref = '/admin';
              } else if (session?.user?.role === 'MERCHANT') {
                rootLabel = 'Dashboard';
                rootHref = '/dashboard';
              }

              return (
                <Breadcrumbs 
                  items={[
                    { label: rootLabel, href: rootHref },
                    { label: 'Curated Drops' }
                  ]} 
                />
              );
            })()}
            {/* Date & Time positioned top-right for desktop */}
            <RealtimeClock />
          </div>
          
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-[0.1em] uppercase mb-4 text-[#1C1C1E]">
              Curated Drops
            </h1>
            <p className="text-xs font-medium uppercase tracking-widest text-[#1C1C1E]/50 max-w-2xl leading-relaxed">
              Exclusive surplus inventory from Iligan&apos;s premier merchants.
            </p>
          </div>
        </header>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-border/50">
            <p className="text-sm uppercase tracking-widest text-[#1C1C1E]/80 font-light mb-2">No drops available</p>
            <p className="text-xs text-[#1C1C1E]/50">Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {listings.map((listing, index) => {
              const reserveAction = reserveSurplusItem.bind(null, listing.id);
              const rating = ratingsMap.get(listing.id);
              
              return (
                <LuxuryItemCard
                  key={listing.id}
                  listingId={listing.id}
                  title={listing.title}
                  merchant={listing.storeName}
                  storeId={listing.storeId}
                  originalPrice={listing.originalPrice}
                  surplusPrice={listing.reservedPrice}
                  imageUrl={listing.imageUrl}
                  availableCount={listing.quantityAvailable}
                  action={reserveAction}
                  index={index}
                  hasReserved={reservedListingIds.has(listing.id)}
                  averageRating={rating?.average}
                  reviewCount={rating?.count}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

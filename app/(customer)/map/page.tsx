import React from "react";
import { getApprovedMerchantsForMap, getFollowedStoreIds } from "@/app/actions/map";
import { SplitMapClient } from "./SplitMapClient";

export const metadata = {
  title: "City Map | RESERVE.",
  description: "Explore surplus drops from Iligan's premier merchants.",
};

export default async function MapPage() {
  const merchants = await getApprovedMerchantsForMap();
  const followedIdsSet = await getFollowedStoreIds();
  const followedIds = Array.from(followedIdsSet);

  return (
    <div className="w-full h-screen bg-[#FAF9F6] flex flex-col overflow-hidden">
      <SplitMapClient merchants={merchants} followedStoreIds={followedIds} />
    </div>
  );
}

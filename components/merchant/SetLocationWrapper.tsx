"use client";

import { SetLocationPanel } from "./SetLocationPanel";
import { updateStoreLocation } from "@/app/actions/merchant";
import { useToast } from "@/hooks/useToast";

interface SetLocationWrapperProps {
  currentLat?: number | null;
  currentLng?: number | null;
  storeName: string;
}

export function SetLocationWrapper({ currentLat, currentLng, storeName }: SetLocationWrapperProps) {
  const { toast } = useToast();

  const handleSave = async (lat: number, lng: number) => {
    const result = await updateStoreLocation(lat, lng);
    
    if (result.error) {
      toast(result.error, "error");
      return false;
    }
    
    if (result.success) {
      toast("Store location updated successfully", "success");
      return true;
    }

    return false;
  };

  return (
    <SetLocationPanel
      currentLat={currentLat}
      currentLng={currentLng}
      storeName={storeName}
      onSave={handleSave}
    />
  );
}
